import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Dynamic config on top of app.json. When APP_VARIANT=development, the app
 * gets a separate identity (name + package) so a dev build can be installed
 * side by side with the preview/production app on the same device.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const isDev = process.env.APP_VARIANT === "development";
  if (!isDev) return config as ExpoConfig;

  return {
    ...(config as ExpoConfig),
    name: `${config.name} Dev`,
    android: {
      ...config.android,
      package: `${config.android?.package}.dev`,
    },
    ...(config.ios?.bundleIdentifier
      ? {
          ios: {
            ...config.ios,
            bundleIdentifier: `${config.ios.bundleIdentifier}.dev`,
          },
        }
      : {}),
  };
};
