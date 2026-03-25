module.exports = (api) => {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: { "@": "./" },
        },
      ],
      ...(process.env.NODE_ENV === "production"
        ? ["transform-remove-console"]
        : []),
      "react-native-reanimated/plugin",
    ],
  };
};
