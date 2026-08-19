<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Donor;
use App\Models\User;

/**
 * API Controller for Managing Donors
 */
class DonorController extends Controller
{
    public function index()
    {
        $donors = Donor::with('user')->get();
        return response()->json($donors);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'UserID' => 'required|exists:users,UserID|unique:Donors,UserID',
            'BloodGroup' => 'required|max:5',
            'Genotype' => 'nullable|max:10',
            'DateOfBirth' => 'nullable|date',
            'WeightKg' => 'nullable|numeric',
            'City' => 'nullable|max:100',
            'LastDonationDate' => 'nullable|date',
            'IsEligible' => 'required|boolean',
        ]);
        
        $donor = Donor::create($validated);
        return response()->json(['message' => 'Donor created successfully', 'donor' => $donor], 201);
    }

    public function show(string $id)
    {
        $donor = Donor::with('user')->findOrFail($id);
        return response()->json($donor);
    }

    public function update(Request $request, string $id)
    {
        $donor = Donor::findOrFail($id);

        $validated = $request->validate([
            'UserID' => 'required|exists:users,UserID|unique:Donors,UserID,' . $donor->DonorID . ',DonorID',
            'BloodGroup' => 'required|max:5',
            'Genotype' => 'nullable|max:10',
            'DateOfBirth' => 'nullable|date',
            'WeightKg' => 'nullable|numeric',
            'City' => 'nullable|max:100',
            'LastDonationDate' => 'nullable|date',
            'IsEligible' => 'required|boolean',
        ]);

        $donor->update($validated);
        return response()->json(['message' => 'Donor updated successfully', 'donor' => $donor]);
    }

    public function destroy(string $id)
    {
        $donor = Donor::findOrFail($id);
        $donor->delete();
        return response()->json(['message' => 'Donor deleted successfully']);
    }
}
