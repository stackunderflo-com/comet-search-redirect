const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? false : 'source-map',

    entry: {
      background: './src/background.js',
      content: './src/content.js',
      popup: './src/popup.js'
    },

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true
    },

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader'
          ]
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/,
          type: 'asset/resource',
          generator: {
            filename: 'icons/[name][ext]'
          }
        }
      ]
    },

    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'public/manifest.json',
            to: 'manifest.json'
          },
          {
            from: 'public/icons',
            to: 'icons',
            noErrorOnMissing: true
          }
        ]
      }),

      new HtmlWebpackPlugin({
        template: './src/popup.html',
        filename: 'popup.html',
        chunks: ['popup']
      }),

      ...(isProduction ? [
        new MiniCssExtractPlugin({
          filename: '[name].css'
        })
      ] : [])
    ],

    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction
            }
          }
        })
      ]
    },

    resolve: {
      extensions: ['.js', '.json']
    },

    // Spécifique aux Chrome Extensions
    target: 'web',

    // Éviter les warnings pour les APIs Chrome
    externals: {
      'chrome': 'chrome'
    }
  };
};