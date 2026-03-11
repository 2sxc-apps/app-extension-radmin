const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = (env = {}) => {
  const entry = {
    tables: "./src/ts/index.ts",
    styles: "./src/styles/styles.scss"
  };
  const outDir = 'extensions/radmin/dist';

  return {
    entry,
    output: {
      globalObject: "self",
      path: path.resolve(__dirname, outDir),
      filename: "[name].js",
    },
    mode: "development",
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, "css-loader"],
        },
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            "css-loader",
            {
              loader: "sass-loader",
              options: {
                sassOptions: {
                  includePaths: ["node_modules"],
                },
              },
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: [".ts", ".js", ".css", ".scss"],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: "[name].min.css",
      }),

      // Special: copy specific files into the extension
      // since they would be needed if someone wants to create customizations.
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, "src/ts/configs/radmin-column-config.ts"),
            to: path.resolve(__dirname, "extensions/radmin/src/configs/radmin-column-config.ts"),
          },
          {
            from: path.resolve(__dirname, "src/ts/configs/radmin-table-config.ts"),
            to: path.resolve(__dirname, "extensions/radmin/src/configs/radmin-table-config.ts"),
          },
          {
            from: path.resolve(__dirname, "src/ts/customizers/table-customizer.ts"),
            to: path.resolve(__dirname, "extensions/radmin/src/customizers/table-customizer.ts"),
          },
        ],
      }),
    ],
  };
};
