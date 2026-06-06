#!/usr/bin/env python3
"""
Generates SkyRadar.xcodeproj/project.pbxproj
Run: python3 generate_project.py
"""
import hashlib, os

def uid(name):
    return hashlib.md5(name.encode()).hexdigest()[:24].upper()

SOURCES = [
    ("SkyRadarApp",          "SkyRadar/SkyRadarApp.swift"),
    ("ContentView",          "SkyRadar/Views/ContentView.swift"),
    ("FlightMapView",        "SkyRadar/Views/MapView/FlightMapView.swift"),
    ("AircraftAnnotation",   "SkyRadar/Views/MapView/AircraftAnnotation.swift"),
    ("AircraftDetailView",   "SkyRadar/Views/DetailView/AircraftDetailView.swift"),
    ("RadarSweepView",       "SkyRadar/Views/Components/RadarSweepView.swift"),
    ("StatsBarView",         "SkyRadar/Views/Components/StatsBarView.swift"),
    ("FilterView",           "SkyRadar/Views/Components/FilterView.swift"),
    ("AircraftPhotoView",    "SkyRadar/Views/Components/AircraftPhotoView.swift"),
    ("SearchOverlayView",    "SkyRadar/Views/SearchView/SearchOverlayView.swift"),
    ("Aircraft",             "SkyRadar/Models/Aircraft.swift"),
    ("AircraftClassifier",   "SkyRadar/Models/AircraftClassifier.swift"),
    ("OpenSkyResponse",      "SkyRadar/Models/OpenSkyResponse.swift"),
    ("OpenSkyService",       "SkyRadar/Services/OpenSkyService.swift"),
    ("LocationService",      "SkyRadar/Services/LocationService.swift"),
    ("PhotoService",         "SkyRadar/Services/PhotoService.swift"),
    ("FlightViewModel",      "SkyRadar/ViewModels/FlightViewModel.swift"),
    ("ColorTheme",           "SkyRadar/Extensions/Color+Theme.swift"),
    ("Formatters",           "SkyRadar/Extensions/Formatters.swift"),
]
RESOURCES = [
    ("Assets",    "SkyRadar/Assets.xcassets"),
    ("InfoPlist", "SkyRadar/Info.plist"),
]

PROJ      = uid("PROJECT")
TARGET    = uid("TARGET_SkyRadar")
MAIN_GRP  = uid("GROUP_Main")
PROD_GRP  = uid("GROUP_Products")
APP_PROD  = uid("PRODUCT_SkyRadar_app")
SRC_PH    = uid("PHASE_Sources")
RES_PH    = uid("PHASE_Resources")
FW_PH     = uid("PHASE_Frameworks")
CFGLIST_P = uid("CFGLIST_Project")
CFGLIST_T = uid("CFGLIST_Target")
CFG_P_D   = uid("CFG_Project_Debug")
CFG_P_R   = uid("CFG_Project_Release")
CFG_T_D   = uid("CFG_Target_Debug")
CFG_T_R   = uid("CFG_Target_Release")

SRC_FR = {n: uid(f"FR_{n}")  for n, _ in SOURCES}
SRC_BF = {n: uid(f"BF_{n}")  for n, _ in SOURCES}
RES_FR = {n: uid(f"FR_{n}")  for n, _ in RESOURCES}
RES_BF = {n: uid(f"BF_{n}")  for n, _ in RESOURCES}

def cmt(t): return f" /* {t} */"

L = []
A = L.append

A("// !$*UTF8*$!")
A("{")
A("\tarchiveVersion = 1;")
A("\tclasses = {};")
A("\tobjectVersion = 56;")
A("\tobjects = {")
A("")

# Build files
A("/* Begin PBXBuildFile section */")
for n, _ in SOURCES:
    A(f"\t\t{SRC_BF[n]} = {{isa = PBXBuildFile; fileRef = {SRC_FR[n]}{cmt(n+'.swift')}; }};")
for n, path in RESOURCES:
    fn = path.split("/")[-1]
    A(f"\t\t{RES_BF[n]} = {{isa = PBXBuildFile; fileRef = {RES_FR[n]}{cmt(fn)}; }};")
A("/* End PBXBuildFile section */")
A("")

# File references
A("/* Begin PBXFileReference section */")
A(f"\t\t{APP_PROD} = {{isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = SkyRadar.app; sourceTree = BUILT_PRODUCTS_DIR; }};")
for n, path in SOURCES:
    fn = path.split("/")[-1]
    A(f"\t\t{SRC_FR[n]} = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = {fn}; sourceTree = \"<group>\"; }};")
for n, path in RESOURCES:
    fn = path.split("/")[-1]
    ft = "folder.assetcatalog" if fn.endswith(".xcassets") else "text.plist.xml"
    A(f"\t\t{RES_FR[n]} = {{isa = PBXFileReference; lastKnownFileType = {ft}; path = {fn}; sourceTree = \"<group>\"; }};")
A("/* End PBXFileReference section */")
A("")

# Frameworks phase
A("/* Begin PBXFrameworksBuildPhase section */")
A(f"\t\t{FW_PH} = {{isa = PBXFrameworksBuildPhase; buildActionMask = 2147483647; files = (); runOnlyForDeploymentPostprocessing = 0; }};")
A("/* End PBXFrameworksBuildPhase section */")
A("")

# Groups
A("/* Begin PBXGroup section */")
A(f"\t\t{MAIN_GRP} = {{isa = PBXGroup; children = ({uid('GROUP_SkyRadar')}{cmt('SkyRadar')}, {PROD_GRP}{cmt('Products')},); sourceTree = \"<group>\"; }};")
A(f"\t\t{PROD_GRP} = {{isa = PBXGroup; children = ({APP_PROD}{cmt('SkyRadar.app')},); name = Products; sourceTree = \"<group>\"; }};")
A(f"\t\t{uid('GROUP_SkyRadar')} = {{")
A(f"\t\t\tisa = PBXGroup;")
A(f"\t\t\tchildren = (")
for n, _ in SOURCES:
    A(f"\t\t\t\t{SRC_FR[n]}{cmt(n+'.swift')},")
for n, _ in RESOURCES:
    A(f"\t\t\t\t{RES_FR[n]},")
A(f"\t\t\t);")
A(f"\t\t\tname = SkyRadar;")
A(f"\t\t\tpath = SkyRadar;")
A(f"\t\t\tsourceTree = \"<group>\";")
A(f"\t\t}};")
A("/* End PBXGroup section */")
A("")

# Native target
A("/* Begin PBXNativeTarget section */")
A(f"\t\t{TARGET} = {{")
A(f"\t\t\tisa = PBXNativeTarget;")
A(f"\t\t\tbuildConfigurationList = {CFGLIST_T};")
A(f"\t\t\tbuildPhases = ({SRC_PH}{cmt('Sources')}, {RES_PH}{cmt('Resources')}, {FW_PH}{cmt('Frameworks')},);")
A(f"\t\t\tbuildRules = ();")
A(f"\t\t\tdependencies = ();")
A(f"\t\t\tname = SkyRadar;")
A(f"\t\t\tproductName = SkyRadar;")
A(f"\t\t\tproductReference = {APP_PROD}{cmt('SkyRadar.app')};")
A(f"\t\t\tproductType = \"com.apple.product-type.application\";")
A(f"\t\t}};")
A("/* End PBXNativeTarget section */")
A("")

# Project
A("/* Begin PBXProject section */")
A(f"\t\t{PROJ} = {{")
A(f"\t\t\tisa = PBXProject;")
A(f"\t\t\tattributes = {{BuildIndependentTargetsInParallel = 1; LastSwiftUpdateCheck = 1500; LastUpgradeCheck = 1500; TargetAttributes = {{{TARGET} = {{CreatedOnToolsVersion = 15.0;}};}};  }};")
A(f"\t\t\tbuildConfigurationList = {CFGLIST_P};")
A(f"\t\t\tcompatibilityVersion = \"Xcode 14.0\";")
A(f"\t\t\tdevelopmentRegion = en;")
A(f"\t\t\thasScannedForEncodings = 0;")
A(f"\t\t\tknownRegions = (en, Base,);")
A(f"\t\t\tmainGroup = {MAIN_GRP};")
A(f"\t\t\tproductRefGroup = {PROD_GRP}{cmt('Products')};")
A(f"\t\t\tprojectDirPath = \"\";")
A(f"\t\t\tprojectRoot = \"\";")
A(f"\t\t\ttargets = ({TARGET}{cmt('SkyRadar')},);")
A(f"\t\t}};")
A("/* End PBXProject section */")
A("")

# Resources phase
A("/* Begin PBXResourcesBuildPhase section */")
A(f"\t\t{RES_PH} = {{isa = PBXResourcesBuildPhase; buildActionMask = 2147483647; files = (")
for n, _ in RESOURCES:
    A(f"\t\t\t{RES_BF[n]},")
A(f"\t\t); runOnlyForDeploymentPostprocessing = 0; }};")
A("/* End PBXResourcesBuildPhase section */")
A("")

# Sources phase
A("/* Begin PBXSourcesBuildPhase section */")
A(f"\t\t{SRC_PH} = {{isa = PBXSourcesBuildPhase; buildActionMask = 2147483647; files = (")
for n, _ in SOURCES:
    A(f"\t\t\t{SRC_BF[n]}{cmt(n+'.swift in Sources')},")
A(f"\t\t); runOnlyForDeploymentPostprocessing = 0; }};")
A("/* End PBXSourcesBuildPhase section */")
A("")

# Build configurations
SHARED = {
    "ALWAYS_SEARCH_USER_PATHS": "NO",
    "CLANG_ENABLE_MODULES": "YES",
    "CLANG_ENABLE_OBJC_ARC": "YES",
    "CLANG_ENABLE_OBJC_WEAK": "YES",
    "CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING": "YES",
    "CLANG_WARN_BOOL_CONVERSION": "YES",
    "CLANG_WARN_DIRECT_OBJC_ISA_USAGE": "YES_ERROR",
    "CLANG_WARN_EMPTY_BODY": "YES",
    "CLANG_WARN_ENUM_CONVERSION": "YES",
    "CLANG_WARN_INT_CONVERSION": "YES",
    "CLANG_WARN_NON_LITERAL_NULL_CONVERSION": "YES",
    "CLANG_WARN_OBJC_ROOT_CLASS": "YES_ERROR",
    "CLANG_WARN_UNREACHABLE_CODE": "YES",
    "COPY_PHASE_STRIP": "NO",
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
TARGET_COMMON = {
    "ASSETCATALOG_COMPILER_APPICON_NAME": "AppIcon",
    "ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME": "AccentColor",
    "CODE_SIGN_STYLE": "Automatic",
    "CURRENT_PROJECT_VERSION": "1",
    "ENABLE_PREVIEWS": "YES",
    "GENERATE_INFOPLIST_FILE": "NO",
    "INFOPLIST_FILE": "SkyRadar/Info.plist",
    "LD_RUNPATH_SEARCH_PATHS": "\"$(inherited) @executable_path/Frameworks\"",
    "MARKETING_VERSION": "1.0",
    "PRODUCT_BUNDLE_IDENTIFIER": "com.skyradar.app",
    "PRODUCT_NAME": "$(TARGET_NAME)",
    "SWIFT_EMIT_LOC_STRINGS": "YES",
}

def xcconfig(u, name, base, extra=None):
    A(f"\t\t{u} = {{isa = XCBuildConfiguration; buildSettings = {{")
    for k, v in sorted({**base, **(extra or {})}.items()):
        A(f"\t\t\t{k} = {v};")
    A(f"\t\t}}; name = {name}; }};")

A("/* Begin XCBuildConfiguration section */")
xcconfig(CFG_P_D, "Debug",   SHARED, {"DEBUG_INFORMATION_FORMAT": "dwarf", "ENABLE_TESTABILITY": "YES", "GCC_OPTIMIZATION_LEVEL": "0", "GCC_PREPROCESSOR_DEFINITIONS": "\"DEBUG=1 $(inherited)\"", "ONLY_ACTIVE_ARCH": "YES", "SWIFT_ACTIVE_COMPILATION_CONDITIONS": "DEBUG", "SWIFT_OPTIMIZATION_LEVEL": "\"-Onone\""})
xcconfig(CFG_P_R, "Release", SHARED, {"ENABLE_NS_ASSERTIONS": "NO", "SWIFT_COMPILATION_MODE": "wholemodule", "SWIFT_OPTIMIZATION_LEVEL": "\"-O\"", "VALIDATE_PRODUCT": "YES"})
xcconfig(CFG_T_D, "Debug",   TARGET_COMMON, {"SWIFT_OPTIMIZATION_LEVEL": "\"-Onone\"", "SWIFT_ACTIVE_COMPILATION_CONDITIONS": "DEBUG"})
xcconfig(CFG_T_R, "Release", TARGET_COMMON, {"SWIFT_COMPILATION_MODE": "wholemodule", "SWIFT_OPTIMIZATION_LEVEL": "\"-O\""})
A("/* End XCBuildConfiguration section */")
A("")

# Config lists
A("/* Begin XCConfigurationList section */")
A(f"\t\t{CFGLIST_P} = {{isa = XCConfigurationList; buildConfigurations = ({CFG_P_D}{cmt('Debug')}, {CFG_P_R}{cmt('Release')},); defaultConfigurationIsVisible = 0; defaultConfigurationName = Release; }};")
A(f"\t\t{CFGLIST_T} = {{isa = XCConfigurationList; buildConfigurations = ({CFG_T_D}{cmt('Debug')}, {CFG_T_R}{cmt('Release')},); defaultConfigurationIsVisible = 0; defaultConfigurationName = Release; }};")
A("/* End XCConfigurationList section */")
A("")

A("\t};")
A(f"\trootObject = {PROJ}{cmt('Project object')};")
A("}")

os.makedirs("SkyRadar.xcodeproj", exist_ok=True)
with open("SkyRadar.xcodeproj/project.pbxproj", "w") as f:
    f.write("\n".join(L))

print("✅  Generated SkyRadar.xcodeproj/project.pbxproj  (%d files)" % len(SOURCES))
