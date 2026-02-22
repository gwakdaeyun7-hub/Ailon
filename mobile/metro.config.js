const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/dist/metro');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

/**
 * Firebase ESM/CJS 인스턴스 불일치 수정
 *
 * 원인: unstable_enablePackageExports=true 에서
 *   - firebase/app  (ESM import) → @firebase/app ESM 인스턴스 A 생성
 *   - firebase/auth (RN CJS)    → @firebase/app CJS 인스턴스 B 생성
 *   → 두 인스턴스의 component registry가 달라
 *     "Component auth has not been registered yet" 에러 발생
 *
 * 수정: @firebase 핵심 패키지를 항상 CJS 단일 경로로 고정
 */
const firebaseCjsMap = {
  '@firebase/app': 'node_modules/@firebase/app/dist/index.cjs.js',
  '@firebase/component': 'node_modules/@firebase/component/dist/index.cjs.js',
  '@firebase/util': 'node_modules/@firebase/util/dist/index.cjs.js',
  '@firebase/logger': 'node_modules/@firebase/logger/dist/index.cjs.js',
};

const originalResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const override = firebaseCjsMap[moduleName];
  if (override) {
    const filePath = path.resolve(__dirname, override);
    if (fs.existsSync(filePath)) {
      return { filePath, type: 'sourceFile' };
    }
  }
  if (originalResolve) {
    return originalResolve(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
