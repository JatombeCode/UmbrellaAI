module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'expo-router/babel',
      '@babel/plugin-transform-flow-strip-types',
      ['@babel/plugin-proposal-private-methods', { loose: false }],
      ['@babel/plugin-transform-private-methods', { loose: false }],
      ['@babel/plugin-transform-class-properties', { loose: false }],
      ['@babel/plugin-transform-private-property-in-object', { loose: false }]
    ],
  };
}; 