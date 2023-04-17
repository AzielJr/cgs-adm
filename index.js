var jwt = require("jsonwebtoken");
const express = require("express");
const app = express();
var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const db = require("./db");
const cors = require("cors");
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  app.use(cors());
  next();
});

const port = process.env.PORT || 3000;

db.connect((err) => {
  if (err) {
    throw err;
  } else {
    console.log("Connect to DB!");
  }
});

app.post("/login", (req, res, next) => {
  if (req.body.user === "admin_cgs" && req.body.pwd === "cgsAdmin*@") {
    //auth ok
    const id = 1; //esse id viria do banco de dados
    var token = jwt.sign({ id }, "mysecret", {
      expiresIn: 300000, // expires in 5min (300)
    });
    return res.status(200).json({ auth: true, token: token });
  }

  return res.status(500).json({ mensage: "Login invalid!" });
});

function verifyJWT(req, res, next) {
  var token = req.headers["x-access-token"];
  if (!token)
    return res.status(401).send({ auth: false, message: "No token provided." });

  jwt.verify(token, "mysecret", function (err, decoded) {
    if (err)
      return res
        .status(500)
        .send({ auth: false, message: "Failed to authenticate token." });

    req.userId = decoded.id;
    next();
  });
}

app.get("/", verifyJWT, async (req, res) => {
  res.send("Pagina Init");
});

app.get("/td_all", verifyJWT, (req, res) => {
  // query que vai bater no banco de dados
  const sql = "SELECT * FROM tipo_despesa order by ds_tipo_despesa";
  db.connect((err) => {
    db.query(sql, (err, results) => {
      // resposta de erro ao bater no abnco de dados
      if (err) {
        return

        throw err;
      }
      // resposta de sucesso ao bater no banco de dados
      res.send(results);
    });
  });
});

app.post("/save_td", verifyJWT, async function (req, res) {
  const descricao = req.body.descricao;
  const codigo_empresa = req.body.codigo_empresa;


  const body = [
    descricao,
    codigo_empresa,
  ];

  await db.connect(() => {

    const sql = `SELECT * FROM tipo_despesa WHERE ds_tipo_despesa = '${descricao}' AND id_empresa = '${codigo_empresa}'`

    try {
      db.connect((err) => {
        db.query(sql, (err, results) => {
          if (results.length > 0) {
            res.status(400).json({
              data: 'Tipo de Despesa ja cadastrado',
              status: 400,
            });
            return
          }
          db.query(
            `INSERT INTO tipo_despesa (ds_tipo_despesa, id_empresa) VALUES (?,?)`,
            body,
            (err, results, fields) => {
              if (err) {
                res.status(400).json({
                  message: err.message,
                  status: 400,
                });
              }
              db.connect((err) => {
                db.query(sql, (err, results) => {
                  if (err) {
                    res.status(400).json({
                      data: 'Tipo de Despesa ja cadastrado',
                      status: 400,
                    });
                    return
                  }
                  res.status(200).json({
                    data: results,
                    status: 200,
                  });
                });
              });
            }
          );
        });
      });

    } catch (err) {
      return

      throw new Error(err);
    }
  });
});

app.delete("/remove/(:id)", verifyJWT, async function (req, res) {
  const id = req.params.id

  await db.connect(() => {

    const sql = `SELECT * FROM tipo_despesa WHERE id_tipo_despesa = '${id}'`

    try {
      db.connect((err) => {
        db.query(sql, (err, results) => {
          if (results.length === 0) {
            res.status(200).json({
              data: 'Tipo de Despesa não encontrado',
              status: 200,
            });
            return
          }
          db.query(
            'DELETE FROM tipo_despesa WHERE id_tipo_despesa = ' + req.params.id,
            id,
            (err, results, fields) => {
              if (err) {
                res.status(400).json({
                  message: err.message,
                  status: 400,
                });
              }
              db.connect((err) => {
                db.query(sql, (err, results) => {
                  if (err) {
                    res.status(400).json({
                      data: 'Tipo de Despesa não encontrada',
                      status: 400,
                    });
                    return
                  }
                  res.status(200).json({
                    data: results,
                    status: 200,
                  });
                });
              });
            }
          );
        });
      });

    } catch (err) {
      return
      throw new Error(err);
    }
  });
});

app.put("/update/(:id)", verifyJWT, async function (req, res) {
  const id = req.params.id
  const descricao = req.body.descricao;

  await db.connect(() => {

    const sql = `SELECT * FROM tipo_despesa WHERE id_tipo_despesa = '${id}'`

    try {
      db.connect((err) => {
        db.query(sql, (err, results) => {
          if (results.length === 0) {
            res.status(200).json({
              data: 'Tipo de Despesa não encontrado',
              status: 200,
            });
            return
          }
          db.query(
            `UPDATE tipo_despesa SET ds_tipo_despesa = '${descricao}' WHERE id_tipo_despesa = '${id}'`,
            id,
            (err, results, fields) => {
              if (err) {
                res.status(400).json({
                  message: err.message,
                  status: 400,
                });
              }
              db.connect((err) => {
                db.query(sql, (err, results) => {
                  if (err) {
                    res.status(400).json({
                      data: 'Tipo de Despesa não encontrada',
                      status: 400,
                    });
                    return
                  }
                  res.status(200).json({
                    data: results,
                    status: 200,
                  });
                });
              });
            }
          );
        });
      });

    } catch (err) {
      return
      throw new Error(err);
    }
  });
});


app.listen(port, () => {
  console.log("Server init");
});
