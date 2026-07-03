const { withMainActivity } = require('@expo/config-plugins');
const { withBuildSourceFile } = require('@expo/config-plugins/build/ios/XcodeProjectFile');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

const IOS_BOLD_TEXT_FIX_SOURCE = `#import <UIKit/UIKit.h>
#import <objc/runtime.h>

@implementation UIView (EkorFishDisableBoldText)

+ (void)load {
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    if (@available(iOS 13.0, *)) {
      Method originalMethod = class_getInstanceMethod([UIView class], @selector(traitCollection));
      Method swizzledMethod = class_getInstanceMethod([UIView class], @selector(ekorfish_traitCollection));
      if (originalMethod && swizzledMethod) {
        method_exchangeImplementations(originalMethod, swizzledMethod);
      }
    }
  });
}

- (UITraitCollection *)ekorfish_traitCollection {
  UITraitCollection *traits = [self ekorfish_traitCollection];
  if (@available(iOS 13.0, *)) {
    if (traits.legibilityWeight == UILegibilityWeightBold) {
      UITraitCollection *regularLegibility =
          [UITraitCollection traitCollectionWithLegibilityWeight:UILegibilityWeightRegular];
      return [UITraitCollection traitCollectionWithTraitsFromCollections:@[traits, regularLegibility]];
    }
  }
  return traits;
}

@end
`;

const IOS_FIX_FILE_NAME = 'EkorFishBoldTextFix.m';

function withAndroidFontWeightFix(config) {
  return withMainActivity(config, (config) => {
    let contents = config.modResults.contents;

    if (!contents.includes('fontWeightAdjustment')) {
      if (!contents.includes('import android.content.Context')) {
        contents = contents.replace(
          /(package [^\n]+\n)/,
          `$1\nimport android.content.Context\nimport android.content.res.Configuration\n`,
        );
      }

      const merged = mergeContents({
        tag: 'ekorfish-font-weight-fix',
        src: contents,
        newSrc: `
  override fun attachBaseContext(newBase: Context) {
    val configuration = Configuration(newBase.resources.configuration)
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
      configuration.fontWeightAdjustment = 0
    }
    super.attachBaseContext(newBase.createConfigurationContext(configuration))
  }`,
        anchor: /class MainActivity[^{]*\{/,
        offset: 1,
        comment: '//',
      });

      if (merged.didMerge || merged.didClear) {
        contents = merged.contents;
      }
    }

    config.modResults.contents = contents;
    return config;
  });
}

function withIosBoldTextFix(config) {
  return withBuildSourceFile(config, {
    filePath: IOS_FIX_FILE_NAME,
    contents: IOS_BOLD_TEXT_FIX_SOURCE,
    overwrite: true,
  });
}

function withDisableSystemFontAccessibility(config) {
  config = withAndroidFontWeightFix(config);
  config = withIosBoldTextFix(config);
  return config;
}

module.exports = withDisableSystemFontAccessibility;
