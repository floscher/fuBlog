import { FakeOAuthProvider, GitlabOAuthProvider, GoogleOAuthProvider, isNotNull, OAuthProvider } from "@fumix/fu-blog-common";
import { AppSettings } from "./settings.js";
import Dict = NodeJS.Dict;

const REGEX_OAUTH_ENV_VARS = /^OAUTH_([A-Z]+)(_([1-9]\d*))?_([A-Z_]+)$/g;

type OAuthEnvVar = {
  type: string; // type of OAuth provider (e.g. `google`, `gitlab`, `fake`)
  index: number; // index number to differentiate multiple providers of same type
  varKey: string; // name of the env var (e.g. `DOMAIN` or `CLIENT_ID` or `CLIENT_SECRET`)
  varValue: string; // value of the env var
};
type GroupedOAuthEnvVars = {
  // env vars grouped by type and index
  [type: string]: {
    [index: number]: {
      [key: string]: string;
    };
  };
};

function loadGroupedOAuthEnvVars(envDictionary: Dict<string>): GroupedOAuthEnvVars {
  return Object.keys(envDictionary)
    .map<OAuthEnvVar | null>((it) => {
      const [match] = it.matchAll(REGEX_OAUTH_ENV_VARS);
      if (match) {
        const [env, type, , i, varKey] = match;
        const varValue: string | undefined = envDictionary[env];
        const index = +(i ?? "0");
        if (type && varKey && varValue) {
          return { type, index, varKey, varValue };
        } else {
          console.log("OAuth env var ");
        }
      }
      return null;
    })
    .reduce<GroupedOAuthEnvVars>((acc, v) => {
      if (v !== null) {
        acc[v.type] = acc[v.type] || [];
        acc[v.type][v.index] = acc[v.type][v.index] || [];
        acc[v.type][v.index][v.varKey] = v.varValue;
      }
      return acc;
    }, {});
}

export function loadOAuthProvidersFromEnv() {
  const providers = Object.entries(loadGroupedOAuthEnvVars(process.env)).flatMap<OAuthProvider>(([type, value]) => {
    return Object.entries(value)
      .map(([i, keyvalue]) => {
        const clientId: string | undefined = keyvalue["CLIENT_ID"];
        const clientSecret: string | undefined = keyvalue["CLIENT_SECRET"];
        const domain: string | undefined = keyvalue["DOMAIN"];
        if (type === "FAKE") {
          if (AppSettings.IS_PRODUCTION) {
            console.error("Fake OAuth is not allowed in production!");
            return null;
          }
        } else if (!clientId || !clientSecret) {
          console.error(`Missing client ID and client secret for OAuth provider ${type} ${i} ${domain}`);
          return null;
        }

        if (domain && domain.includes("/")) {
          console.error(`OAuth domain "${domain}" must not contain a forward slash!`);
          return null;
        }

        switch (type) {
          case "GITLAB":
            return new GitlabOAuthProvider(clientId, clientSecret, domain);
          case "GOOGLE":
            return new GoogleOAuthProvider(clientId, clientSecret, domain);
          case "FAKE":
            return new FakeOAuthProvider(clientId, clientSecret, domain, process.env["OAUTH_FAKE_HTTPS"] !== "false");
          default:
            console.error(`Unrecognized OAuth provider type: ${type}`);
        }
      })
      .filter(isNotNull);
  });
  if (!AppSettings.IS_PRODUCTION && !providers.some((it) => it.constructor.name === FakeOAuthProvider.constructor.name)) {
    providers.push(new FakeOAuthProvider());
  }
  return providers;
}