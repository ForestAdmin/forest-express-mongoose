module.exports = {
  branches: ['main', '+([0-9])?(.{+([0-9]),x}).x', {name: 'beta', prerelease: true}],
  plugins: [
    [
      '@semantic-release/commit-analyzer', {
        preset: 'angular',
        releaseRules: [
          // Example: `type(scope): subject [force release]`
          { subject: '*\\[force release\\]*', release: 'patch' },
        ],
      },
    ],
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    '@semantic-release/npm',
    '@semantic-release/git',
    '@semantic-release/github',
    [
      'semantic-release-slack-bot',
      {
        markdownReleaseNotes: true,
        notifyOnSuccess: true,
        notifyOnFail: false,
        onSuccessTemplate: {
          text: "📦 $package_name@$npm_package_version has been released!",
          blocks: [{
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*New `$package_name` package released!*'
            }
          }, {
            type: 'context',
            elements: [{
              type: 'mrkdwn',
              text: "📦  *Version:* <$repo_url/releases/tag/v$npm_package_version|$npm_package_version>"
            }]
          }, {
            type: 'divider',
          }],
          attachments: [{
            blocks: [{
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '*Changes* of version $release_notes',
              },
            }],
          }],
        },
        packageName: 'forest-express-mongoose',
      }
    ],
    [
      "semantic-release-npm-deprecate-old-versions", {
        "rules": [
          {
            "rule": "supportLatest",
            "options": {
              "numberOfMajorReleases": 3,
              "numberOfMinorReleases": "all",
              "numberOfPatchReleases": "all"
            }
          },
          {
            "rule": "supportPreReleaseIfNotReleased",
            "options": {
              "numberOfPreReleases": 1,
            }
          },
          "deprecateAll"
        ]
      }
    ]
  ],
}
