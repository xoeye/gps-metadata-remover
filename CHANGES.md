# 1.0.10

-adds NPM keywords to help people actually finds the package
-renames removeLocationStream to removeLocation. the former name was an artifact of an older version of this package and since it doesn't stream anything anymore, i figured to take it out to avoid confusion.
-uncomment unused arrayBufferToBase64 helper function. it was commented out because we didn't need it but presumably some client might

# 1.0.9

Add metadata to point npm package back to our github repo.

# 1.0.8

Change package name to match XOi npm scope. No user facing changes.

# 1.0.7

No changes. This is strictly a version bump release.

# 1.0.6

No changes. This is strictly a version bump release.

# 1.0.5

Bump `ffprobe` dependency to resolve CVE in `bl`

# 1.0.4

Support XMP tags in PNGs

# 1.0.3

Support photos exported from iPhoto where both JFIF and EXIF can be present (https://stackoverflow.com/questions/2697869/does-exif-metadata-always-get-stored-just-after-the-jfif-header)

# 1.0.0

Initial release
