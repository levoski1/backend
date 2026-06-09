declare module 'passport-apple' {
  import { Strategy as OAuth2Strategy } from 'passport-oauth2';

  export interface AppleStrategyOptions {
    clientID: string;
    teamID: string;
    keyID: string;
    callbackURL: string;
    privateKeyLocation?: string;
    privateKeyString?: string;
    scope?: string | string[];
    passReqToCallback?: boolean;
    authorizationURL?: string;
    tokenURL?: string;
  }

  export type AppleVerifyFunction = (
    accessToken: string,
    refreshToken: string,
    idToken: Record<string, unknown>,
    profile: Record<string, unknown> | undefined,
    done: (error: Error | null, user?: Express.User | false, info?: { message?: string }) => void,
  ) => void;

  export type AppleVerifyFunctionWithRequest = (
    req: Express.Request,
    accessToken: string,
    refreshToken: string,
    idToken: Record<string, unknown>,
    profile: Record<string, unknown> | undefined,
    done: (error: Error | null, user?: Express.User | false, info?: { message?: string }) => void,
  ) => void;

  class Strategy extends OAuth2Strategy {
    constructor(options: AppleStrategyOptions, verify: AppleVerifyFunction | AppleVerifyFunctionWithRequest);
    name: string;
  }

  export default Strategy;
}
