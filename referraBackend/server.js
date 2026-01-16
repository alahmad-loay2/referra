import app from './app.js';
import { PORT } from './config/env.js'


app.listen(PORT,'0.0.0.0', async () => {
    console.log(`Server is running on port ${PORT}`);
})
