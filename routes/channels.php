<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;
use App\Models\User;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// Canal público para órdenes
Broadcast::channel('ordenes', function () {
    Log::info('Canal "ordenes" siendo autorizado para usuario', [
        'user_id' => auth()->id(),
        'user_name' => auth()->user() ? auth()->user()->name : 'No autenticado',
        'user_role' => auth()->user() ? auth()->user()->role : 'Sin rol'
    ]);
    
    return true; // Canal público, cualquier usuario autenticado puede suscribirse
});

// Canal privado para usuarios específicos
Broadcast::channel('App.Models.User.{id}', function (User $user, $id) {
    Log::info('Canal usuario privado siendo autorizado', [
        'auth_user_id' => $user->id,
        'requested_id' => $id,
        'authorized' => (int) $user->id === (int) $id
    ]);
    
    return (int) $user->id === (int) $id;
});