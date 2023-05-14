const Path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const Fibers = require('fibers');
const DartSass = require('sass');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const FixStyleOnlyEntriesPlugin = require('webpack-fix-style-only-entries');
const TerserPlugin = require('terser-webpack-plugin');
const ESLintWebpackPlugin = require('eslint-webpack-plugin');
const StylelintWebpackPlugin = require('stylelint-webpack-plugin');

const outputPath = Path.resolve(__dirname, 'dist');

const versionString = require('./package.json').version;

module.exports = {
    mode: 'production',
    entry: {
        'main': './src/app.jsx',
    },
    output: {
        filename: `main.js?ver=${versionString}`,
        path: outputPath
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                parallel: true,
                terserOptions: {
                    sourceMap: true,
                }
            }),
        ],
    },
    cache: true,
    watchOptions: {
        ignored: /node_modules/,
        poll: true,
    },
    module: {
        rules: [
            {
                test: /\.html$/,
                use: [ 'html-loader' ]
            },
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: { presets: ['@babel/preset-env', '@babel/react'] },
                    }
                ]
            },
            {
                test: /\.(sc|sa|c)ss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    {
                        loader: 'sass-loader',
                        options: {
                            implementation: DartSass,
                            // sassOptions: {
                            //     fiber: Fibers
                            // }
                        }
                    }
                ],
            },
            {
                test: /\.(jpe?g|png|gif|woff2?|[to]tf|eot|svg)$/,
                type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 8 * 1024,
                    },
                },
            },
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
            filename: 'index.html',
        }),
        new MiniCssExtractPlugin({
            filename: `[name].bundle.css?ver=${versionString}`
        }),
        new FixStyleOnlyEntriesPlugin(),
        new ESLintWebpackPlugin({
            fix: true,
        }),
        new StylelintWebpackPlugin({
            configFile: '.stylelintrc.js',
            fix: true,
        }),
    ],

    performance: {
        hints: false
    },
};
