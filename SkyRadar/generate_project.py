#!/usr/bin/env python3
"""
Generates SkyRadar.xcodeproj/project.pbxproj
Run: python3 generate_project.py
"""
import hashlib, os, textwrap

def uid(name):
    """Stable 24-char uppercase hex UUID from a name."""
    return hashlib.md5(name.encode()).hexdigest()[:24].upper()

# ── Source files ────────────────────────────────────────────────────────────
SOURCES = [
    ("SkyRadarApp",          "SkyRadar/SkyRadarApp.swift"),
    ("ContentView",          "SkyRadar/Views/ContentView.swift"),
    ("FlightMapView",        "SkyRadar/Views/MapView/FlightMapView.swift"),
    ("AircraftAnnotation",   "SkyRadar/Views/MapView/AircraftAnnotation.swift"),
    ("AircraftDetailView",   "SkyRadar/Views/DetailView/AircraftDetailView.swift"),
    ("RadarSweepView",       "SkyRadar/Views/Components/RadarSweepView.swift"),
    ("StatsBarView",         "SkyRadar/Views/Components/StatsBarView.swift"),
    ("FilterView",           "SkyRadar/Views/Components/FilterView.swift"),
    ("SearchOverlayView",    "SkyRadar/Views/SearchView/SearchOverlayView.swift"),
    ("Aircraft",             "SkyRadar/Models/Aircraft.swift"),
    ("OpenSkyResponse",      "SkyRadar/Models/OpenSkyResponse.swift"),
    ("OpenSkyService",       "SkyRadar/Services/OpenSkyService.swift"),
    ("LocationService",      "SkyRadar/Services/LocationService.swift"),
    ("FlightViewModel",      "SkyRadar/ViewModels/FlightViewModel.swift"),
    ("ColorTheme",           "SkyRadar/Extensions/Color+Theme.swift"),
    ("Formatters",           "SkyRadar/Extensions/Formatters.swift"),
]
RESOURCES = [
    ("Assets",    "SkyRadar/Assets.xcassets"),
    ("InfoPlist", "SkyRadar/Info.plist"),
]

# ── UUIDs ───────────────────────────────────────────────────────────────────
PROJ        = uid("PROJECT")
TARGET      = uid("TARGET_SkyRadar")
MAIN_GRP    = uid("GROUP_Main")
PROD_GRP    = uid("GROUP_Products")
APP_PROD    = uid("PRODUCT_SkyRadar_app")
SRC_PHASE   = uid("PHASE_Sources")
RES_PHASE   = uid("PHASE_Resources")
FW_PHASE    = uid("PHASE_Frameworks")
CFGLIST_P   = uid("CFGLIST_Project")
CFGLIST_T   = uid("CFGLIST_Target")
CFG_P_DBG   = uid("CFG_Project_Debug")
CFG_P_REL   = uid("CFG_Project_Release")
CFG_T_DBG   = uid("CFG_Target_Debug")
CFG_T_REL   = uid("CFG_Target_Release")

# file refs and build files
SRC_FR  = {n: uid(f"FR_{n}")  for n, _ in SOURCES}
SRC_BF  = {n: uid(f"BF_{n}")  for n, _ in SOURCES}
RES_FR  = {n: uid(f"FR_{n}")  for n, _ in RESOURCES}
RES_BF  = {n: uid(f"BF_{n}")  for n, _ in RESOURCES}

# ── Build helpers ────────────────────────────────────────────────────────────
def pbx_comment(text): return f" /* {text} */"

def fr_line(uid_val, path, file_type, name=None):
    name_part = f"name = {name}; " if name else ""
    return (f"\t\t{uid_val} = "
            f"{{isa = PBXFileReference; lastKnownFileType = {file_type}; "
            f"{name_part}path = {path}; sourceTree = \"<group>\"; }};")

def build_file_line(bf, fr, comment=""):
    return f"\t\t{bf} = {{isa = PBXBuildFile; fileRef = {fr}{pbx_comment(comment) if comment else ''}; }};"

# ── Assemble ─────────────────────────────────────────────────────────────────
lines = []
A = lines.append

A("// !$*UTF8*$!")
A("{")
A("\tarchiveVersion = 1;")
A("\tclasses = {")
A("\t};")
A("\tobjectVersion = 56;")
A("\tobjects = {")
A("")

# PBXBuildFile
A("/* Begin PBXBuildFile section */")
for name, path in SOURCES:
    A(build_file_line(SRC_BF[name], SRC_FR[name], name + ".swift"))
for name, path in RESOURCES:
    A(build_file_line(RES_BF[name], RES_FR[name], path.split("/")[-1]))
A("/* End PBXBuildFile section */")
A("")

# PBXFileReference
A("/* Begin PBXFileReference section */")
A(f"\t\t{APP_PROD} = {{isa = PBXFileReference; explicitFileType = wrapper.application; "
  f"includeInIndex = 0; path = SkyRadar.app; sourceTree = BUILT_PRODUCTS_DIR; }};")
for name, path in SOURCES:
    fname = path.split("/")[-1]
    A(fr_line(SRC_FR[name], fname, "sourcecode.swift"))
for name, path in RESOURCES:
    fname = path.split("/")[-1]
    ftype = "folder.assetcatalog" if fname.endswith(".xcassets") else "text.plist.xml"
    A(fr_line(RES_FR[name], fname, ftype))
A("/* End PBXFileReference section */")
A("")

# PBXFrameworksBuildPhase
A("/* Begin PBXFrameworksBuildPhase section */")
A(f"\t\t{FW_PHASE} = {{")
A(f"\t\t\tisa = PBXFrameworksBuildPhase;")
A(f"\t\t\tbuildActionMask = 2147483647;")
A(f"\t\t\tfiles = (")
A(f"\t\t\t);")
A(f"\t\t\trunOnlyForDeploymentPostprocessing = 0;")
A(f"\t\t}};")
A("/* End PBXFrameworksBuildPhase section */")
A("")

# PBXGroup
A("/* Begin PBXGroup section */")

# Main group
A(f"\t\t{MAIN_GRP} = {{")
A(f"\t\t\tisa = PBXGroup;")
A(f"\t\t\tchildren = (")
A(f"\t\t\t\t{uid('GROUP_SkyRadar')}{pbx_comment('SkyRadar')},")
A(f"\t\t\t\t{PROD_GRP}{pbx_comment('Products')},")
A(f"\t\t\t);")
A(f"\t\t\tsourceTree = \"<group>\";")
A(f"\t\t}};")

# Products group
A(f"\t\t{PROD_GRP} = {{")
A(f"\t\t\tisa = PBXGroup;")
A(f"\t\t\tchildren = (")
A(f"\t\t\t\t{APP_PROD}{pbx_comment('SkyRadar.app')},")
A(f"\t\t\t);")
A(f"\t\t\tname = Products;")
A(f"\t\t\tsourceTree = \"<group>\";")
A(f"\t\t}};")

# SkyRadar source group (flat — Xcode will still organise by path)
A(f"\t\t{uid('GROUP_SkyRadar')} = {{")
A(f"\t\t\tisa = PBXGroup;")
A(f"\t\t\tchildren = (")
for name, _ in SOURCES:
    A(f"\t\t\t\t{SRC_FR[name]}{pbx_comment(name + '.swift')},")
for name, _ in RESOURCES:
    A(f"\t\t\t\t{RES_FR[name]},")
A(f"\t\t\t);")
A(f"\t\t\tname = SkyRadar;")
A(f"\t\t\tpath = SkyRadar;")
A(f"\t\t\tsourceTree = \"<group>\";")
A(f"\t\t}};")

A("/* End PBXGroup section */")
A("")

# PBXNativeTarget
A("/* Begin PBXNativeTarget section */")
A(f"\t\t{TARGET} = {{")
A(f"\t\t\tisa = PBXNativeTarget;")
A(f"\t\t\tbuildConfigurationList = {CFGLIST_T}{pbx_comment('Build configuration list for PBXNativeTarget SkyRadar')};")
A(f"\t\t\tbuildPhases = (")
A(f"\t\t\t\t{SRC_PHASE}{pbx_comment('Sources')},")
A(f"\t\t\t\t{RES_PHASE}{pbx_comment('Resources')},")
A(f"\t\t\t\t{FW_PHASE}{pbx_comment('Frameworks')},")
A(f"\t\t\t);")
A(f"\t\t\tbuildRules = (")
A(f"\t\t\t);")
A(f"\t\t\tdependencies = (")
A(f"\t\t\t);")
A(f"\t\t\tname = SkyRadar;")
A(f"\t\t\tproductName = SkyRadar;")
A(f"\t\t\tproductReference = {APP_PROD}{pbx_comment('SkyRadar.app')};")
A(f"\t\t\tproductType = \"com.apple.product-type.application\";")
A(f"\t\t}};")
A("/* End PBXNativeTarget section */")
A("")

# PBXProject
A("/* Begin PBXProject section */")
A(f"\t\t{PROJ} = {{")
A(f"\t\t\tisa = PBXProject;")
A(f"\t\t\tattributes = {{")
A(f"\t\t\t\tBuildIndependentTargetsInParallel = 1;")
A(f"\t\t\t\tLastSwiftUpdateCheck = 1500;")
A(f"\t\t\t\tLastUpgradeCheck = 1500;")
A(f"\t\t\t\tTargetAttributes = {{")
A(f"\t\t\t\t\t{TARGET} = {{")
A(f"\t\t\t\t\t\tCreatedOnToolsVersion = 15.0;")
A(f"\t\t\t\t\t}};")
A(f"\t\t\t\t}};")
A(f"\t\t\t}};")
A(f"\t\t\tbuildConfigurationList = {CFGLIST_P}{pbx_comment('Build configuration list for PBXProject SkyRadar')};")
A(f"\t\t\tcompatibilityVersion = \"Xcode 14.0\";")
A(f"\t\t\tdevelopmentRegion = en;")
A(f"\t\t\thasScannedForEncodings = 0;")
A(f"\t\t\tknownRegions = (")
A(f"\t\t\t\ten,")
A(f"\t\t\t\tBase,")
A(f"\t\t\t);")
A(f"\t\t\tmainGroup = {MAIN_GRP};")
A(f"\t\t\tproductRefGroup = {PROD_GRP}{pbx_comment('Products')};")
A(f"\t\t\tprojectDirPath = \"\";")
A(f"\t\t\tprojectRoot = \"\";")
A(f"\t\t\ttargets = (")
A(f"\t\t\t\t{TARGET}{pbx_comment('SkyRadar')},")
A(f"\t\t\t);")
A(f"\t\t}};")
A("/* End PBXProject section */")
A("")

# PBXResourcesBuildPhase
A("/* Begin PBXResourcesBuildPhase section */")
A(f"\t\t{RES_PHASE} = {{")
A(f"\t\t\tisa = PBXResourcesBuildPhase;")
A(f"\t\t\tbuildActionMask = 2147483647;")
A(f"\t\t\tfiles = (")
for name, _ in RESOURCES:
    A(f"\t\t\t\t{RES_BF[name]},")
A(f"\t\t\t);")
A(f"\t\t\trunOnlyForDeploymentPostprocessing = 0;")
A(f"\t\t}};")
A("/* End PBXResourcesBuildPhase section */")
A("")

# PBXSourcesBuildPhase
A("/* Begin PBXSourcesBuildPhase section */")
A(f"\t\t{SRC_PHASE} = {{")
A(f"\t\t\tisa = PBXSourcesBuildPhase;")
A(f"\t\t\tbuildActionMask = 2147483647;")
A(f"\t\t\tfiles = (")
for name, _ in SOURCES:
    A(f"\t\t\t\t{SRC_BF[name]}{pbx_comment(name + '.swift in Sources')},")
A(f"\t\t\t);")
A(f"\t\t\trunOnlyForDeploymentPostprocessing = 0;")
A(f"\t\t}};")
A("/* End PBXSourcesBuildPhase section */")
A("")

# XCBuildConfiguration
SHARED_SETTINGS = {
    "ALWAYS_SEARCH_USER_PATHS": "NO",
    "CLANG_ANALYZER_NONNULL": "YES",
    "CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION": "YES_AGGRESSIVE",
    "CLANG_CXX_LANGUAGE_STANDARD": "\"gnu++20\"",
    "CLANG_ENABLE_MODULES": "YES",
    "CLANG_ENABLE_OBJC_ARC": "YES",
    "CLANG_ENABLE_OBJC_WEAK": "YES",
    "CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING": "YES",
    "CLANG_WARN_BOOL_CONVERSION": "YES",
    "CLANG_WARN_COMMA": "YES",
    "CLANG_WARN_CONSTANT_CONVERSION": "YES",
    "CLANG_WARN_DEPRECATED_OBJC_IMPLEMENTATIONS": "YES",
    "CLANG_WARN_DIRECT_OBJC_ISA_USAGE": "YES_ERROR",
    "CLANG_WARN_DOCUMENTATION_COMMENTS": "YES",
    "CLANG_WARN_EMPTY_BODY": "YES",
    "CLANG_WARN_ENUM_CONVERSION": "YES",
    "CLANG_WARN_INFINITE_RECURSION": "YES",
    "CLANG_WARN_INT_CONVERSION": "YES",
    "CLANG_WARN_NON_LITERAL_NULL_CONVERSION": "YES",
    "CLANG_WARN_OBJC_IMPLICIT_RETAIN_SELF": "YES",
    "CLANG_WARN_OBJC_LITERAL_CONVERSION": "YES",
    "CLANG_WARN_OBJC_ROOT_CLASS": "YES_ERROR",
    "CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER": "YES",
    "CLANG_WARN_RANGE_LOOP_ANALYSIS": "YES",
    "CLANG_WARN_STRICT_PROTOTYPES": "YES",
    "CLANG_WARN_SUSPICIOUS_MOVE": "YES",
    "CLANG_WARN_UNGUARDED_AVAILABILITY": "YES_AGGRESSIVE",
    "CLANG_WARN_UNREACHABLE_CODE": "YES",
    "CLANG_WARN__DUPLICATE_METHOD_MATCH": "YES",
    "COPY_PHASE_STRIP": "NO",
    "DEBUG_INFORMATION_FORMAT": "dwarf-with-dsym",
    "ENABLE_STRICT_OBJC_MSGSEND": "YES",
    "GCC_C_LANGUAGE_STANDARD": "gnu11",
    "GCC_NO_COMMON_BLOCKS": "YES",
    "GCC_WARN_64_TO_32_BIT_CONVERSION": "YES",
    "GCC_WARN_ABOUT_RETURN_TYPE": "YES_ERROR",
    "GCC_WARN_UNDECLARED_SELECTOR": "YES",
    "GCC_WARN_UNINITIALIZED_AUTOS": "YES_AGGRESSIVE",
    "GCC_WARN_UNUSED_FUNCTION": "YES",
    "GCC_WARN_UNUSED_VARIABLE": "YES",
    "IPHONEOS_DEPLOYMENT_TARGET": "16.0",
    "MTL_FAST_MATH": "YES",
    "SDKROOT": "iphoneos",
    "SWIFT_VERSION": "5.0",
    "TARGETED_DEVICE_FAMILY": "\"1,2\"",
}

TARGET_SETTINGS_COMMON = {
    "ASSETCATALOG_COMPILER_APPICON_NAME": "AppIcon",
    "ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME": "AccentColor",
    "CODE_SIGN_STYLE": "Automatic",
    "CURRENT_PROJECT_VERSION": "1",
    "DEVELOPMENT_ASSET_PATHS": "\"\\\"SkyRadar/Preview Content\\\"\"",
    "ENABLE_PREVIEWS": "YES",
    "GENERATE_INFOPLIST_FILE": "NO",
    "INFOPLIST_FILE": "SkyRadar/Info.plist",
    "LD_RUNPATH_SEARCH_PATHS": "\"$(inherited) @executable_path/Frameworks\"",
    "MARKETING_VERSION": "1.0",
    "PRODUCT_BUNDLE_IDENTIFIER": "com.skyradar.app",
    "PRODUCT_NAME": "$(TARGET_NAME)",
    "SWIFT_EMIT_LOC_STRINGS": "YES",
    "TARGETED_DEVICE_FAMILY": "\"1,2\"",
}

def write_xcconfig(uid_val, name, base, extra=None):
    A(f"\t\t{uid_val} = {{")
    A(f"\t\t\tisa = XCBuildConfiguration;")
    A(f"\t\t\tbuildSettings = {{")
    all_settings = {**base, **(extra or {})}
    for k, v in sorted(all_settings.items()):
        A(f"\t\t\t\t{k} = {v};")
    A(f"\t\t\t}};")
    A(f"\t\t\tname = {name};")
    A(f"\t\t}};")

A("/* Begin XCBuildConfiguration section */")
write_xcconfig(CFG_P_DBG, "Debug", SHARED_SETTINGS, {
    "DEBUG_INFORMATION_FORMAT": "dwarf",
    "ENABLE_TESTABILITY": "YES",
    "GCC_DYNAMIC_NO_PIC": "NO",
    "GCC_OPTIMIZATION_LEVEL": "0",
    "GCC_PREPROCESSOR_DEFINITIONS": "\"DEBUG=1 $(inherited)\"",
    "MTL_ENABLE_DEBUG_INFO": "INCLUDE_SOURCE",
    "ONLY_ACTIVE_ARCH": "YES",
    "SWIFT_ACTIVE_COMPILATION_CONDITIONS": "DEBUG",
    "SWIFT_OPTIMIZATION_LEVEL": "\"-Onone\"",
})
write_xcconfig(CFG_P_REL, "Release", SHARED_SETTINGS, {
    "ENABLE_NS_ASSERTIONS": "NO",
    "SWIFT_COMPILATION_MODE": "wholemodule",
    "SWIFT_OPTIMIZATION_LEVEL": "\"-O\"",
    "VALIDATE_PRODUCT": "YES",
})
write_xcconfig(CFG_T_DBG, "Debug", TARGET_SETTINGS_COMMON, {
    "DEBUG_INFORMATION_FORMAT": "dwarf",
    "SWIFT_OPTIMIZATION_LEVEL": "\"-Onone\"",
    "SWIFT_ACTIVE_COMPILATION_CONDITIONS": "DEBUG",
})
write_xcconfig(CFG_T_REL, "Release", TARGET_SETTINGS_COMMON, {
    "SWIFT_COMPILATION_MODE": "wholemodule",
    "SWIFT_OPTIMIZATION_LEVEL": "\"-O\"",
})
A("/* End XCBuildConfiguration section */")
A("")

# XCConfigurationList
A("/* Begin XCConfigurationList section */")
A(f"\t\t{CFGLIST_P} = {{")
A(f"\t\t\tisa = XCConfigurationList;")
A(f"\t\t\tbuildConfigurations = (")
A(f"\t\t\t\t{CFG_P_DBG}{pbx_comment('Debug')},")
A(f"\t\t\t\t{CFG_P_REL}{pbx_comment('Release')},")
A(f"\t\t\t);")
A(f"\t\t\tdefaultConfigurationIsVisible = 0;")
A(f"\t\t\tdefaultConfigurationName = Release;")
A(f"\t\t}};")
A(f"\t\t{CFGLIST_T} = {{")
A(f"\t\t\tisa = XCConfigurationList;")
A(f"\t\t\tbuildConfigurations = (")
A(f"\t\t\t\t{CFG_T_DBG}{pbx_comment('Debug')},")
A(f"\t\t\t\t{CFG_T_REL}{pbx_comment('Release')},")
A(f"\t\t\t);")
A(f"\t\t\tdefaultConfigurationIsVisible = 0;")
A(f"\t\t\tdefaultConfigurationName = Release;")
A(f"\t\t}};")
A("/* End XCConfigurationList section */")
A("")

A("\t};")
A(f"\trootObject = {PROJ}{pbx_comment('Project object')};")
A("}")

pbxproj = "\n".join(lines)

os.makedirs("SkyRadar.xcodeproj", exist_ok=True)
with open("SkyRadar.xcodeproj/project.pbxproj", "w") as f:
    f.write(pbxproj)

print("✅  Generated SkyRadar.xcodeproj/project.pbxproj")
