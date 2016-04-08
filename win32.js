var path = require('path')

var mv = require('mv')
var series = require('run-series')
var common = require('./common')

module.exports = {
  createApp: function createApp (opts, templatePath, callback) {
    common.initializeApp(opts, templatePath, path.join('resources', 'app'), function buildWinApp (err, tempPath) {
      var tempPathBak = tempPath;
      if (err) return callback(err)

      var newExePath;
      var operations = [
        function (cb) {
          mv(tempPath, path.join(tempPath, '../temp'), cb)
          tempPath = path.join(tempPath, '../temp');
          newExePath = path.join(tempPath, 'electron.exe');
        }
      ]

      if (opts.icon || opts['version-string']) {
        operations.push(function (cb) {
          common.normalizeExt(opts.icon, '.ico', function (err, icon) {
            var rcOpts = {}
            if (opts['version-string']) {
              rcOpts['version-string'] = opts['version-string']

              if (opts['build-version']) {
                rcOpts['file-version'] = opts['build-version']
              } else if (opts['version-string'].FileVersion) {
                rcOpts['file-version'] = opts['version-string'].FileVersion
              }

              if (opts['app-version']) {
                rcOpts['product-version'] = opts['app-version']
              } else if (opts['version-string'].ProductVersion) {
                rcOpts['product-version'] = opts['version-string'].ProductVersion
              }

              if (opts['app-copyright']) {
                rcOpts['version-string'].LegalCopyright = opts['app-copyright']
              }
            }

            // Icon might be omitted or only exist in one OS's format, so skip it if normalizeExt reports an error
            if (!err) {
              rcOpts.icon = icon
            }

            require('rcedit')(newExePath, rcOpts, cb)
          })
        })
      }

      operations.push(function (cb) {
        newExePath = path.join(tempPath, opts.name + '.exe')
        mv(path.join(tempPath, 'electron.exe'), newExePath, cb)
      });

      operations.push(function (cb) {
        mv(tempPath, tempPathBak, cb)
      });

      series(operations, function (err) {
        if (err) return callback(err)
        common.moveApp(opts, tempPath, callback)
      })
    })
  }
}
