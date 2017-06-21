const Sequelize = require('sequelize')
sequelize = new Sequelize('mysql://root:MPJzfq97@localhost:3306/water_resources')
const User = sequelize.define('user', {
  firstName: {
    type: Sequelize.STRING
  },
  lastName: {
    type: Sequelize.STRING
  }
});

User.findAll().then(users => {
  console.log(users)
  sequelize.close()
})

