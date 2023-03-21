import {acceptHMRUpdate, defineStore} from 'pinia';
import type {Token} from '../wrappers/api';
import * as api from '../wrappers/api';

type Tokens = {
	tokens?: Token[];
};

export const useTokens = defineStore('tokens', {
	state: (): Tokens => ({
		tokens: undefined,
	}),
	actions: {
		setTokens(payload: Token[]) {
			this.tokens = payload;
		},
		async loadTokens() {
			try {
				const tokens = await api.getTokens();
				if (!tokens.message || tokens.error) {
					if (tokens.error) {
						throw typeof tokens.error === 'string'
							? new Error(tokens.error)
							: tokens.error;
					}

					throw new Error('No tokens found');
				}

				this.setTokens(tokens.message);
			} catch (error: unknown) {
				throw error as Error;
			}
		},
	},
});

/* If (import.meta.hot) {
	 import.meta.hot.accept(acceptHMRUpdate(useTokens, import.meta.hot));
} */
