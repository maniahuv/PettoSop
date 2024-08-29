import { Strategy as LocalStrategy } from 'passport-local'
import db from './connectDB.js'
import { compare } from 'bcrypt'
function initialize(passport) {
    const autheticateUser = async (email, password, done) => {
        try {
            let result = await db.one(`select * from staffs where email = $1`, [email])

            if (result) {
                const user = result

                compare(password, user.phone, (err) => {
                    if (err) {
                        throw err
                    }
                    if(password === user.phone) {
                        return done(null, user)
                    } else {
                        return done(null, false, {passErr: '*Sai mật khẩu'})
                    }
                })
            } else {
                return done(null, false, {emailErr: '*Email chưa được đăng ký'})
            }
        } catch (err) {
            console.error('Error runing database query: ', err)
            return done(null, false, {emailErr: '*Email chưa được đăng ký'})
        }
    }
    passport.use(
        new LocalStrategy(
            {
                usernameField: 'email',
                passwordField: 'phone'
            },
            autheticateUser
        )
    )

    passport.serializeUser((user, done) => done(null, user.staff_id))

    passport.deserializeUser((id, done) => {
        try {
            db.oneOrNone('select * from staffs as u where u.staff_id = $1', [id])
                .then(user => {
                    done(null, user)
                })
                .catch(err => {
                    done(err)
                })
        } catch (err) {
            done(err)
        }
    })
}

export default initialize