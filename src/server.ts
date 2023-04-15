/* eslint-disable @typescript-eslint/no-confusing-void-expression */
/* eslint-disable @typescript-eslint/no-misused-promises */
import express, { type NextFunction, type Request, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hash, compare } from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';

const server = express();
const prisma = new PrismaClient();

server.use(express.json());

type CreateUserDto = {
  name: string;
  email: string;
  password: string;
}

async function createUser ({ name, email, password }: CreateUserDto): Promise<void> {
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password
    }
  });

  console.log(user);
};

const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const authToken = req.headers.authorization?.split(' ')[1];

  if (!authToken) return res.status(401).json({ message: 'Unauthorized!' });

  try {
    const { id } = verify(authToken, 'batatinha') as { id: string };
    const user = await prisma.user.findFirst({ where: { id } });
    if (!user) return res.status(401).json({ message: 'Unauthorized!' });
  } catch (error) {
    return res.status(400).json({ message: 'Token inválido!' });
  }

  next();
};

server.get('/', (req: Request, res: Response) => {
  res.json({ message: 'OK' });
});

server.post('/user', authMiddleware, async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) return res.status(400).send({ message: 'Todos os campos são obrigatórios: [name, email, password]' });

  const existsUser = await prisma.user.findFirst({
    where: {
      email
    }
  });

  if (existsUser) return res.status(400).send({ message: 'Email já cadastrado!' });

  const hashedPassword = await hash(password, 8);

  const user = await createUser({ name, email, password: hashedPassword });

  res.status(201).json(user);
});

server.post('/signin', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).send({ message: 'Todos os campos são obrigatórios: [email, password]' });

  const user = await prisma.user.findFirst({
    where: {
      email
    }
  });

  if (!user) return res.status(400).json({ message: 'Usuário não encontrado!' });

  const isCorrectPassword = await compare(password, user.password);

  if (!isCorrectPassword) return res.status(400).json({ message: 'Senha incorreta!' });

  const token = sign({ id: user.id, name: user.name, email: user.email }, 'batatinha');

  await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      auth_token: token
    }
  });

  return res.json({ message: 'BEM VINDO A PUTARIA🔥', token });
});

server.get('/user', authMiddleware, async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      password: false,
      auth_token: false,
      created_at: true,
      updated_at: true,
      deleted_at: false
    }
  });

  return res.json(users);
});

server.listen(3333, () => { console.log('Server running on host: http://localhost:3333'); });
