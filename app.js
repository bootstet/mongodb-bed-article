const express = require('express')
const { MongoClient, ObjectID } = require('mongodb')

const connectUri = 'mongodb://localhost:27017'

const dbClient = new MongoClient(connectUri)

const app = express()
const bodyParser = require('body-parser')

// 配置解析请求体数据 application/json
// 把解析到的数据放到req.body中
// 一定要在使用之前挂载中间件
app.use(express.json())
// app.use(bodyParser.urlencoded({ extended: true }))


app.get('/', (req, res) => {
  res.send('Hello World')
})

app.post('/articles', async(req, res, next) => {
  try {
    console.log('--------')
    // 1 获取客户端的表单数据
    const { article } = req.body
    // 2 数据验证
    if (!article || !article.title || !article.descrition || !article.body) {
      return res.status(422).json({
        error: '请求参数不符合规则要求'
      })
    }
    // 3 把验证通过的数据插入数据库中
    //  成功 -> 发送成功的相应
    //  失败 -> 发送失败的响应
    await dbClient.connect()
    const collection = dbClient.db('test').collection('articles')
    const ret = await collection.insertOne(article)
    // console.log(req.body) // 获取请求数据
    // res.send('post /acticles')
    article._id = ret.insertedId
    article.createdAt = new Date()
    article.updatedAt = new Date()
    res.status(201).json({
      article
    })
  } catch (err) {
    // 由错误处理中间件统一处理
    next(err)
  }
})

app.get('/articles', async (req, res, next) => {
  try {
    const { _page = 1, _size = 5 } = req.query
    await dbClient.connect()
    const collection = dbClient.db('test').collection('articles')
    // res.send('get /acticles')
    const ret = await collection
        .find() // 查询数据
        .skip((Number.parseInt(_page) - 1) * _size)  // 跳过多少条
        .limit(Number.parseInt(_size))  // 拿多少条
    const articles = await ret.toArray()
    const articlesCount = await collection.countDocuments()
    // console.log(ret)
    res.status(200).json({
      articles,
      articlesCount
    })
  } catch (err) {
    next(err)
  }
})

app.get('/articles/:id', async (req, res, next) => {
  try {
    await dbClient.connect()
    const collection = dbClient.db('test').collection('articles')

    const acticle = await collection.findOne({
      _id: ObjectID(req.params.id)
    })

    res.status(200).json({
      acticle
    })
  } catch (error) {
      next(error)
  }
})

app.patch('/articles/:id', async (req, res, next) => {
  try {
    await dbClient.connect()
    const collection = dbClient.db('test').collection('articles')
    collection.updateOne({
      _id: ObjectID(req.params.id)
    }, {
      $set: req.body.article
    })

    const article = await collection.findOne(ObjectID(req.params.id))
    res.status(201).json({
      article
    })
  } catch (error) {
    next(error)
  }
})


app.delete('/articles/:id', (req, res) => {
  res.send('delete /acticles/:id')
})
// 它之前的所有路由中调用 next(err) 就会进入这里
// 注意： 4个参数， 缺一不可
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message
  })
})

app.listen(3000, () => {
  console.log('app listenning at port 3000.')
})

