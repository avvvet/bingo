// @ts-nocheck
import { writable } from "svelte/store";

let socket = null 

export const gsocket = writable(null);
export const socketMessage = writable(null);
export const socketConnected = writable(false);


export function initSocket() {
    if (socket) return; // Already initialized

    let port = 22201;
    const socketUrl = `ws://localhost:${port}/v1/ws`;
    
    socket = new WebSocket(socketUrl);
    gsocket.set(socket)

    socket.onopen = () => {
      socketConnected.set(true);
      console.log('✅ WebSocket connected');
    };
  
    socket.onmessage = (event) => {
        socketMessage.set(event.data); // Broadcast to all subscribers
    };
  
    socket.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
  
    socket.onclose = () => {
      console.warn('🔌 WebSocket disconnected');
      socketConnected.set(false);
      socket = null; // Allow re-initialization
    };
}