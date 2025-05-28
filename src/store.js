import { writable } from 'svelte/store';

export const socketService = writable(null);
export const player = writable({});
export const game = writable({})
export const gamePlayers = writable([])
export const playerCard = writable("")
export const balance = writable(0)

