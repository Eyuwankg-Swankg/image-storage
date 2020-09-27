const LocalStrategy = require("passport-local").Strategy;
const passwordHash = require("password-hash");
function initialize(passport, getUserByEmail) {
  passport.use(
    new LocalStrategy({ usernameField: "email" }, function (
      email,
      password,
      done
    ) {
      const user = getUserByEmail(email);
      if (user == null) {
        return done(null, false);
      }
      if (passwordHash.verify(password, user.password)) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((id, done) => {});
}

module.exports = initialize;
