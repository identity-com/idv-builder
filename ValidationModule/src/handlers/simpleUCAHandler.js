/* eslint-disable-file no-param-reassign,class-methods-use-this */
const { UCAHandler, Context } = require('@identity.com/idv-commons');

// a handler that accepts all UCA values
class SimpleUCAHandler extends UCAHandler {
  async handleUCA(value, ucaState) {
    Context.log('SimpleUCAHandler accepted uca value', { value, ucaState })
  }
}

module.exports = {
  SimpleUCAHandler: new SimpleUCAHandler()
};

// NOOP handler
// module.exports = (state,event) => state
