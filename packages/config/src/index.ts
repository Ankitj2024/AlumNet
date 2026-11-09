import { env, validateEnv, envSchema, EnvConfig } from './env.js';

export * from './env.js';

// Backward compatibility alias for existing code referencing `config`
export const config = env;
export type AppConfig = EnvConfig;
export const loadConfig = validateEnv;
