const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000 || process.env.PORT;

// readyMade Middlewares
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("job24-server is running");
});

app.listen(port, () => {
    console.log(`Server is running at PORT: ${port}`);
});