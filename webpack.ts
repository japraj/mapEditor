import HtmlWebpackPlugin from "html-webpack-plugin";
import * as webpack from "webpack";
import "webpack-dev-server";

const config: webpack.Configuration = {
  mode: "development",
  entry: {
    main: "./src/index.ts",
  },
  devtool: "inline-source-map",
  module: {
    rules: [
      {
        test: /\.html$/,
        use: ["html-loader"],
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader",
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/template.html",
    }),
  ],
  target: "browserslist",
  resolve: {
    extensions: [".ts", ".html"],
    mainFiles: ["index"],
  },
};

module.exports = config;
