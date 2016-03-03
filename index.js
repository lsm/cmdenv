/**
 * cmdenv.js - a utility which merges environmental variables with command line options
 */

var Command = require('commander').Command

var cmdenv = module.exports = function(prefix) {
  var commander = new Command()
  var parse = commander.parse.bind(commander)

  var _prefix
  if (prefix && 'string' === typeof prefix)
    _prefix = prefix.toUpperCase()

  // monkey patch the `parse` function
  commander.parse = function(argv) {
    var result = parse(argv) || commander

    console.log(result.options);

    if (result.options.length > 0) {
      // Get value from env if it is not presented in command line options
      result.options.forEach(function(opt) {
        if (opt.long) {
          // Should only works for options with long name
          var optEnvName
          var optInArgv = argv.indexOf(opt.long) > -1
          var optLongName = opt.long.slice(2)
          optLongName = optLongName.split('-')

          // Get the camelcase long name which used by commander:
          // `--db-port` will be converted to `dbPort`
          if (optLongName.length > 1) {
            optLongName = optLongName.map(function(name, idx) {
              if (idx > 0) {
                name = name[0].toUpperCase() + name.slice(1)
              }
              return name
            })
          }

          // Get corresponding environment variable name:
          // `--db-port` with prefix `app` will be converted to `APP_DB_PORT`
          optEnvName = optLongName.join('_').toUpperCase()
          optLongName = optLongName.join('')

          var envName = (_prefix ? _prefix + '_' : '') + optEnvName

          // Only get value from environment when option is defined
          // but not presented in command line.
          if (false === optInArgv && process.env[envName])
            result[optLongName] = process.env[envName]
        }
      })
    }

    return result
  }

  return commander
}


// example usage
if (require.main === module) {
  var _result = cmdenv('prefix')
    .option('-m --mongodb [url]', 'Set the mongodb server address')
    .option('-r --redis-server [url]', 'Set the redis server address')
    .parse(process.argv)

  if (!_result.mongodb && !_result.redisServer) {
    console.log('Example:\n');
    console.log(_result.optionHelp());
    console.log('\nexport PREFIX_MONGODB or PREFIX_REDIS_SERVER to set environmental value for -m or -r');
  }

  console.log('\nmongodb: %s, redis-server: %s', _result.mongodb, _result.redisServer)
}
