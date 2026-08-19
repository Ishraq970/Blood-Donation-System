<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;

/**
 * API Controller for Managing Users
 */
class UserController extends Controller
{
    public function index()
    {
        $users = User::all();
        return response()->json($users);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'FullName' => 'required|max:100',
            'Email' => 'required|email|unique:users,Email',
            'PasswordHash' => 'required',
            'Phone' => 'nullable|max:20',
            'Address' => 'nullable|max:255',
            'Gender' => 'nullable|max:20',
        ]);
        
        $validated['PasswordHash'] = bcrypt($validated['PasswordHash']);
        $user = User::create($validated);
        
        return response()->json(['message' => 'User created successfully', 'user' => $user], 201);
    }

    public function show(string $id)
    {
        $user = User::findOrFail($id);
        return response()->json($user);
    }

    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'FullName' => 'required|max:100',
            'Email' => 'required|email|unique:users,Email,' . $user->UserID . ',UserID',
            'Phone' => 'nullable|max:20',
            'Address' => 'nullable|max:255',
            'Gender' => 'nullable|max:20',
            'AccountStatus' => 'required|max:30',
        ]);

        if ($request->filled('PasswordHash')) {
            $validated['PasswordHash'] = bcrypt($request->PasswordHash);
        }

        $user->update($validated);
        return response()->json(['message' => 'User updated successfully', 'user' => $user]);
    }

    public function destroy(string $id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        
        return response()->json(['message' => 'User deleted successfully']);
    }
}
