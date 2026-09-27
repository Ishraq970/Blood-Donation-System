<?php

namespace App\Services;

use App\Models\BloodRequest;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

class ChatService
{
    public function __construct(
        protected NotificationService $notificationService
    ) {}

    /**
     * Retrieve or initialize the emergency coordination conversation for a blood request.
     */
    public function getOrCreateConversation(BloodRequest $request): Conversation
    {
        return DB::transaction(function () use ($request) {
            $conversation = Conversation::firstOrCreate(
                ['blood_request_id' => $request->id],
                [
                    'title' => "Coordination: {$request->request_code} ({$request->blood_group})",
                    'is_locked' => in_array($request->status, ['FULFILLED', 'CANCELLED', 'EXPIRED']),
                ]
            );

            // Ensure requester is participant
            if ($request->requester_id) {
                $this->addParticipant($conversation, $request->requester, 'REQUESTER');
            }

            // Ensure primary volunteer is participant if assigned
            if ($request->primary_volunteer_id) {
                $volunteer = User::find($request->primary_volunteer_id);
                if ($volunteer) {
                    $this->addParticipant($conversation, $volunteer, 'VOLUNTEER');
                }
            }

            // Ensure all accepted donors are participants
            $acceptedMatches = $request->matches()->where('response_status', 'ACCEPTED')->with('donorProfile.user')->get();
            foreach ($acceptedMatches as $match) {
                if ($match->donorProfile && $match->donorProfile->user) {
                    $this->addParticipant($conversation, $match->donorProfile->user, 'DONOR');
                }
            }

            return $conversation->fresh(['participants.user', 'messages.sender']);
        });
    }

    /**
     * Add a participant to the conversation.
     */
    public function addParticipant(Conversation $conversation, User $user, string $role = 'REQUESTER'): ConversationParticipant
    {
        return ConversationParticipant::firstOrCreate(
            [
                'conversation_id' => $conversation->id,
                'user_id' => $user->id,
            ],
            [
                'role_in_request' => strtoupper($role),
                'last_read_at' => now(),
            ]
        );
    }

    /**
     * Send a message from a participant.
     */
    public function sendMessage(
        Conversation $conversation,
        User $sender,
        string $text,
        string $type = 'TEXT',
        array $metadata = []
    ): Message {
        if ($conversation->is_locked) {
            throw new AuthorizationException('This coordination conversation is closed because the request has concluded.');
        }

        if (!$conversation->isParticipant($sender)) {
            throw new AuthorizationException('You are not authorized to send messages in this coordination conversation.');
        }

        return DB::transaction(function () use ($conversation, $sender, $text, $type, $metadata) {
            $message = Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $sender->id,
                'message_text' => trim($text),
                'message_type' => $type,
                'metadata' => $metadata,
            ]);

            $conversation->update(['last_message_at' => now()]);

            // Notify other participants who have chat_messages enabled
            $otherParticipants = $conversation->participants()
                ->where('user_id', '!=', $sender->id)
                ->with('user')
                ->get();

            foreach ($otherParticipants as $participant) {
                $user = $participant->user;
                if (!$user) continue;

                $prefs = $user->getPreferences();
                if ($prefs->channel_push && $prefs->chat_messages) {
                    $this->notificationService->sendPushNotification(
                        $user,
                        "💬 {$sender->name} (Coordination)",
                        $text,
                        [
                            'type' => 'CHAT_MESSAGE',
                            'conversation_uuid' => $conversation->uuid,
                            'url' => route('requests.show', $conversation->bloodRequest->request_code),
                        ]
                    );
                }
            }

            return $message;
        });
    }

    /**
     * Send an automated system coordination notice.
     */
    public function sendSystemNotice(Conversation $conversation, string $text, array $metadata = []): Message
    {
        // Use requester or system sender ID
        $senderId = $conversation->bloodRequest->requester_id;

        return Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $senderId,
            'message_text' => $text,
            'message_type' => 'SYSTEM_NOTICE',
            'metadata' => $metadata,
        ]);
    }

    /**
     * Lock conversation upon request fulfillment or cancellation.
     */
    public function lockConversation(Conversation $conversation, string $reason = 'Emergency blood request concluded'): void
    {
        if ($conversation->is_locked) {
            return;
        }

        $conversation->update(['is_locked' => true]);

        $this->sendSystemNotice(
            $conversation,
            "Coordination concluded: {$reason}. This conversation is now archived and read-only."
        );
    }
}
