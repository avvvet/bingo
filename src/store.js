import { writable } from 'svelte/store';

export const socketService = writable(null);
export const player = writable({});

