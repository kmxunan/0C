// 零碳园区数字孪生系统 - Webpack性能优化配置
// 版本: 2.0
// 作者: 零碳园区开发团队
// 日期: 2025-06-15

const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const isDevelopment = !isProduction;

  return {
    // 入口配置
    entry: {
      main: './src/index.js',
      vendor: [
        'react',
        'react-dom',
        'react-router-dom',
        'redux',
        'react-redux',
        '@reduxjs/toolkit'
      ],
      // 按功能模块分割
      energyMonitoring: './src/modules/energy-monitoring/index.js',
      carbonAccounting: './src/modules/carbon-accounting/index.js',
      virtualPowerPlant: './src/modules/virtual-power-plant/index.js',
      resourceCirculation: './src/modules/resource-circulation/index.js',
      dataGovernance: './src/modules/data-governance/index.js',
      greenElectricity: './src/modules/green-electricity/index.js'
    },

    // 输出配置
    output: {
      path: path.resolve(__dirname, '../dist'),
      filename: isProduction 
        ? 'js/[name].[contenthash:8].js'
        : 'js/[name].js',
      chunkFilename: isProduction
        ? 'js/[name].[contenthash:8].chunk.js'
        : 'js/[name].chunk.js',
      publicPath: '/',
      clean: true
    },

    // 模式配置
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'eval-cheap-module-source-map',

    // 解析配置
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, '../src'),
        '@components': path.resolve(__dirname, '../src/components'),
        '@modules': path.resolve(__dirname, '../src/modules'),
        '@utils': path.resolve(__dirname, '../src/utils'),
        '@services': path.resolve(__dirname, '../src/services'),
        '@assets': path.resolve(__dirname, '../src/assets'),
        '@styles': path.resolve(__dirname, '../src/styles')
      },
      // 优化模块解析
      modules: ['node_modules', path.resolve(__dirname, '../src')],
      symlinks: false
    },

    // 模块配置
    module: {
      rules: [
        // JavaScript/TypeScript处理
        {
          test: /\.(js|jsx|ts|tsx)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: [
                  ['@babel/preset-env', {
                    useBuiltIns: 'usage',
                    corejs: 3,
                    targets: {
                      browsers: ['> 1%', 'last 2 versions', 'not ie <= 8']
                    }
                  }],
                  '@babel/preset-react',
                  '@babel/preset-typescript'
                ],
                plugins: [
                  '@babel/plugin-proposal-class-properties',
                  '@babel/plugin-syntax-dynamic-import',
                  ['import', {
                    libraryName: 'antd',
                    libraryDirectory: 'es',
                    style: true
                  }]
                ],
                cacheDirectory: true
              }
            }
          ]
        },
        // CSS处理
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                modules: {
                  auto: true,
                  localIdentName: isProduction 
                    ? '[hash:base64:8]'
                    : '[name]__[local]--[hash:base64:5]'
                },
                importLoaders: 1
              }
            },
            'postcss-loader'
          ]
        },
        // Less处理
        {
          test: /\.less$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            {
              loader: 'less-loader',
              options: {
                lessOptions: {
                  modifyVars: {
                    '@primary-color': '#1890ff',
                    '@success-color': '#52c41a',
                    '@warning-color': '#faad14',
                    '@error-color': '#f5222d'
                  },
                  javascriptEnabled: true
                }
              }
            }
          ]
        },
        // 图片处理
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024 // 8KB
            }
          },
          generator: {
            filename: 'images/[name].[hash:8][ext]'
          }
        },
        // 字体处理
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name].[hash:8][ext]'
          }
        }
      ]
    },

    // 优化配置
    optimization: {
      minimize: isProduction,
      minimizer: [
        // JavaScript压缩
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction,
              drop_debugger: isProduction,
              pure_funcs: isProduction ? ['console.log', 'console.info'] : []
            },
            mangle: {
              safari10: true
            },
            format: {
              comments: false
            }
          },
          extractComments: false,
          parallel: true
        }),
        // CSS压缩
        new CssMinimizerPlugin({
          parallel: true
        })
      ],
      // 代码分割
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // 第三方库
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10
          },
          // React相关
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 20
          },
          // UI库
          antd: {
            test: /[\\/]node_modules[\\/]antd[\\/]/,
            name: 'antd',
            chunks: 'all',
            priority: 15
          },
          // 图表库
          charts: {
            test: /[\\/]node_modules[\\/](echarts|@antv|d3)[\\/]/,
            name: 'charts',
            chunks: 'all',
            priority: 15
          },
          // 公共模块
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true
          }
        }
      },
      // 运行时优化
      runtimeChunk: {
        name: 'runtime'
      },
      // 模块ID优化
      moduleIds: 'deterministic',
      chunkIds: 'deterministic'
    },

    // 插件配置
    plugins: [
      // 清理输出目录
      new CleanWebpackPlugin(),

      // HTML生成
      new HtmlWebpackPlugin({
        template: './public/index.html',
        filename: 'index.html',
        inject: true,
        minify: isProduction ? {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true
        } : false
      }),

      // CSS提取
      ...(isProduction ? [
        new MiniCssExtractPlugin({
          filename: 'css/[name].[contenthash:8].css',
          chunkFilename: 'css/[name].[contenthash:8].chunk.css'
        })
      ] : []),

      // Gzip压缩
      ...(isProduction ? [
        new CompressionPlugin({
          algorithm: 'gzip',
          test: /\.(js|css|html|svg)$/,
          threshold: 8192,
          minRatio: 0.8
        })
      ] : []),

      // PWA支持
      ...(isProduction ? [
        new WorkboxPlugin.GenerateSW({
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\./,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 5 * 60 // 5分钟
                }
              }
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 30 * 24 * 60 * 60 // 30天
                }
              }
            }
          ]
        })
      ] : []),

      // 环境变量
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
        'process.env.API_BASE_URL': JSON.stringify(
          process.env.API_BASE_URL || (isProduction ? '/api' : 'http://localhost:3001/api')
        ),
        'process.env.WS_BASE_URL': JSON.stringify(
          process.env.WS_BASE_URL || (isProduction ? '/ws' : 'ws://localhost:3001/ws')
        )
      }),

      // 热更新
      ...(isDevelopment ? [
        new webpack.HotModuleReplacementPlugin()
      ] : []),

      // 包分析（可选）
      ...(process.env.ANALYZE ? [
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: 'bundle-report.html'
        })
      ] : [])
    ],

    // 开发服务器配置
    devServer: isDevelopment ? {
      static: {
        directory: path.join(__dirname, '../public')
      },
      compress: true,
      port: 3000,
      hot: true,
      open: true,
      historyApiFallback: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false
        },
        '/ws': {
          target: 'ws://localhost:3001',
          ws: true,
          changeOrigin: true
        }
      },
      client: {
        overlay: {
          errors: true,
          warnings: false
        }
      }
    } : undefined,

    // 性能配置
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000, // 500KB
      maxAssetSize: 512000 // 500KB
    },

    // 缓存配置
    cache: {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename]
      }
    },

    // 实验性功能
    experiments: {
      topLevelAwait: true
    }
  };
};