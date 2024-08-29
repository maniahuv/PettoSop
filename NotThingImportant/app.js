import express from 'express';
import { engine } from 'express-handlebars';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './connectDB.js'
import passport from 'passport'
import initializePassport from './passportConfig.js'
import session from 'express-session';

const __filename = fileURLToPath(import.meta.url);



function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    next();
}

// Middleware kiểm tra chưa xác thực
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

// Middleware kiểm tra trạng thái đăng nhập
function checkLoginStatus(req, res, next) {
    res.locals.login = req.isAuthenticated(); // Kiểm tra xem người dùng có đăng nhập hay không
    if (req.isAuthenticated()) {
        res.locals.role = req.user.role;
        res.locals.name = req.user.username; // Lưu tên người dùng vào res.locals
    }
    next();
}

// 👇️ "/home/john/Desktop/javascript"
const __dirname = path.dirname(__filename);

const app = express();


// Cài middlewate và cài đặt của Express
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
initializePassport(passport);
app.use(express.urlencoded({
    extended: true
}))
app.use(morgan('combined'))
app.use(express.json())
app.engine('hbs', engine({
    extname: '.hbs'
}));
app.set('view engine', 'hbs');
app.set('views', './views');
app.use(express.static(path.join(__dirname, '/public')))

app.get('/', async (req, res) => {
    let reviews = await db.any(`
        select * from feedback as fb
        join customers cu on fb.customer_id = cu.customer_id
        where fb.rate >= 4
        limit 3;
    `)
    let reviewsHtml = ``
    if (reviews) {
        reviews.forEach(review => {
            reviewsHtml += `
                <div class="contact3-content1">
                        <div class="contact3-contact-info">
                            <div class="contact3-content2">
                                <h3 class="contact3-text2 thq-heading-3">${review.rate} sao</h3>
                                <p class="contact3-text3 thq-body-large">
                                    <span>
                                        ${review.noi_dung}
                                    </span>
                                </p>
                            </div>
                            <span class="contact3-email thq-body-small">
                                <span>${review.name}</span>
                            </span>
                        </div>
                    </div>
            `
        })
    }
    console.log(reviewsHtml)
    res.render('home', {
        reviews: reviewsHtml
    });
});

app.get('/petlist', async (req, res) => {
    let getPet = await db.any(`
        select * from pets where lower(species) = $1;
        `, [req.query.pet])
    let getPetHtml = ``
    if (getPet) {
        getPet.forEach(pet => {
            getPetHtml += `
            <div class="pet-information ">
                    <div class="pet-image-container">
                        <img src="/image/${pet.pet_id}.jpg"
                            alt="" class="pet-image">
                    </div>
                    <div class="pet-detail">
                        <div class="pet-name margin-3-0">
                            <p>${pet.pet_id} - <span>${pet.name}</span> <span>${pet.color}</span> <span>${pet.gender}</span></p>
                        </div>
                        <div class="pet-price margin-3-0">
                            <span class="bold">${pet.cost} $</span>
                            <span class="sale">Không giảm !</span>
                        </div>
                        <div class="pet-installment">
                            Trả góp từ <span class="installment">Không trả góp</span>
                        </div>
                    </div>
                </div>
        `
        })
    }
    res.render('petlist', {
        pet: req.query.pet,
        petlist: getPetHtml
    })
})

app.post('/admin', checkNotAuthenticated, async (req, res) => {
    console.log(req.body)
    if (req.body.name) {
        let listPets = await db.any(`
            select * from pets;
        `)
        console.log(listPets.length)
        let id = `P${listPets.length + 1}`
        await db.none(`
            insert into pets (pet_id, name, age, gender, species, color, cost, supplier_id)
            values ($1, $2, $3, $4, $5, $6, $7, $8);
        `, [id, req.body.name, parseInt(req.body.age), req.body.gender, req.body.species, req.body.color, parseFloat(req.body.cost), req.body.supplier_id])
            .catch(err => {
                console.error(err)
                res.send('Đã xảy ra lỗi vui lòng liên hệ Admin')
            })
    }
    if (req.body.firstname) {
        let listUser = await db.any(`
            select * from customers;
        `)
        let id = `C0${listUser.length + 1}`
        await db.none(`
            insert into customers (customer_id, name, age, gender, address, phone, email)
            values ($1, $2, $3, $4, $5, $6, $7);
        `, [id, req.body.firstname + req.body.lastname, parseInt(req.body.userage), req.body.usergender, req.body.address, req.body.phone, req.body.email])
            .catch(err => {
                console.error(err)
                res.send('Đã xảy ra lỗi vui lòng liên hệ Admin')
            })
    }

    let userList = await db.any(`
        select * from customers;
        `)
    let userListHtml = ``
    if (userList) {
        for (let user of userList) {
            userListHtml += `
            <div class="user">
                <h2 class="user-name">${user.name}</h2>
                <p class="user-age">Age: ${user.age}</p>
                <p class="user-gender">Gender: ${user.gender}</p>
                <p class="user-address">Address: ${user.address}</p>
                <p class="user-phone">Phone: ${user.phone}</p>
                <p class="user-email">Email: ${user.email}</p>
            </div>`
        }
    }
    res.render('admin', {
        userList: userListHtml
    })
})
app.get('/admin', checkNotAuthenticated, async (req, res) => {
    console.log(req.query)
    let userList = await db.any(`
        select * from customers;
        `)
    let userListHtml = ``
    if (userList) {
        for (let user of userList) {
            userListHtml += `
            <div class="user">
                <h2 class="user-name">${user.name}</h2>
                <p class="user-age">Age: ${user.age}</p>
                <p class="user-gender">Gender: ${user.gender}</p>
                <p class="user-address">Address: ${user.address}</p>
                <p class="user-phone">Phone: ${user.phone}</p>
                <p class="user-email">Email: ${user.email}</p>
            </div>`
        }
    }
    res.render('admin', {
        userList: userListHtml
    })
})


app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.render('login', {
                errorMessage: info,
                email: req.body.email
            });
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect('/admin');
        });
    })(req, res, next);
});
app.get('/login', async (req, res) => {
    res.render('login')
})
app.listen(8080);