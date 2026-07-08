const fs = require('fs');
const path = require('path');
const plist = require('@expo/plist');
const {
  IOSConfig,
  createRunOncePlugin,
  withAppDelegate,
  withInfoPlist,
  withPodfile,
  withXcodeProject,
} = require('@expo/config-plugins');
const {
  addResourceFileToGroup,
  getProjectName,
} = require('@expo/config-plugins/build/ios/utils/Xcodeproj');

const POD_LINES = [
  "  pod 'FirebaseAppCheckInterop', :modular_headers => true",
  "  pod 'FirebaseAuthInterop', :modular_headers => true",
  "  pod 'GoogleUtilities', :modular_headers => true",
  "  pod 'RecaptchaInterop', :modular_headers => true",
];
const GOOGLE_SERVICE_PLIST = 'GoogleService-Info.plist';
const FIREBASE_BOOTSTRAP_MARKER = '@vinago/firebase-ios-bootstrap';

function withGoogleSignInModularHeaders(config) {
  config = withPodfile(config, (config) => {
    let contents = config.modResults.contents;
    const staticFrameworkLine = '$RNFirebaseAsStaticFramework = true';
    if (!contents.includes(staticFrameworkLine)) {
      contents = contents.replace(
        /(podfile_properties = JSON\.parse\(File\.read\(File\.join\(__dir__, 'Podfile\.properties\.json'\)\)\) rescue \{\}\n)/,
        `$1${staticFrameworkLine}\n`,
      );
    }

    const missingPodLines = POD_LINES.filter((line) => !contents.includes(line));

    if (missingPodLines.length === 0) {
      config.modResults.contents = contents;
      return config;
    }

    const anchor = '  use_expo_modules!\n';
    if (!contents.includes(anchor)) {
      throw new Error('Could not find use_expo_modules! in ios/Podfile.');
    }

    config.modResults.contents = contents.replace(
      anchor,
      `${anchor}\n${missingPodLines.join('\n')}\n`,
    );
    return config;
  });

  config = withInfoPlist(config, (config) => {
    const googleServiceFilePath = getGoogleServiceFilePath(config);
    if (!googleServiceFilePath) return config;

    const reversedClientId = getReversedClientId(googleServiceFilePath);
    if (reversedClientId && !IOSConfig.Scheme.hasScheme(reversedClientId, config.modResults)) {
      config.modResults = IOSConfig.Scheme.appendScheme(reversedClientId, config.modResults);
    }
    return config;
  });

  config = withXcodeProject(config, (config) => {
    const googleServiceFilePath = getGoogleServiceFilePath(config);
    if (!googleServiceFilePath) return config;

    const sourceRoot = IOSConfig.Paths.getSourceRoot(config.modRequest.projectRoot);
    fs.copyFileSync(googleServiceFilePath, path.join(sourceRoot, GOOGLE_SERVICE_PLIST));

    const projectName = getProjectName(config.modRequest.projectRoot);
    const plistFilePath = `${projectName}/${GOOGLE_SERVICE_PLIST}`;
    if (!config.modResults.hasFile(plistFilePath)) {
      config.modResults = addResourceFileToGroup({
        filepath: plistFilePath,
        groupName: projectName,
        isBuildFile: true,
        project: config.modResults,
      });
    }
    return config;
  });

  config = withAppDelegate(config, (config) => {
    if (config.modResults.language !== 'swift') {
      return config;
    }

    config.modResults.contents = addFirebaseBootstrap(config.modResults.contents);
    return config;
  });

  return config;
}

function getGoogleServiceFilePath(config) {
  const relativePath = config.ios?.googleServicesFile ?? `./${GOOGLE_SERVICE_PLIST}`;
  const absolutePath = path.resolve(config.modRequest.projectRoot, relativePath);
  return fs.existsSync(absolutePath) ? absolutePath : null;
}

function getReversedClientId(googleServiceFilePath) {
  try {
    const parsed = plist.parse(fs.readFileSync(googleServiceFilePath, 'utf8'));
    return typeof parsed.REVERSED_CLIENT_ID === 'string' ? parsed.REVERSED_CLIENT_ID : null;
  } catch {
    return null;
  }
}

function addFirebaseBootstrap(contents) {
  let next = contents;

  if (!next.includes('import FirebaseCore')) {
    next = next.replace(
      /(internal\s+)?import Expo/,
      (match) => `${match}\nimport FirebaseCore`,
    );
  }

  if (next.includes(FIREBASE_BOOTSTRAP_MARKER)) {
    return next;
  }

  const bootstrap = `    // @generated begin ${FIREBASE_BOOTSTRAP_MARKER} - expo prebuild (DO NOT MODIFY)
    if FirebaseApp.app() == nil,
       Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist") != nil {
      FirebaseApp.configure()
    }
    // @generated end ${FIREBASE_BOOTSTRAP_MARKER}

`;
  const anchor = '    factory.startReactNative(';
  if (!next.includes(anchor)) {
    return next;
  }

  return next.replace(anchor, `${bootstrap}${anchor}`);
}

module.exports = createRunOncePlugin(
  withGoogleSignInModularHeaders,
  'with-google-signin-modular-headers',
  '1.0.0',
);
