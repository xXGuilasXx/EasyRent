"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../services/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Listar todos os carros
router.get('/', async (req, res) => {
    try {
        const carros = await prisma_1.default.carro.findMany({
            include: {
                modelo: {
                    include: {
                        marca: true
                    }
                }
            },
            orderBy: [
                { modelo: { marca: { nome: 'asc' } } },
                { modelo: { descricao: 'asc' } },
                { ano: 'desc' }
            ]
        });
        res.json(carros);
    }
    catch (error) {
        console.error('Erro ao listar carros:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
// Buscar carros disponíveis para locação
router.get('/disponiveis', async (req, res) => {
    try {
        const { dataInicio, dataFim } = req.query;
        if (!dataInicio || !dataFim) {
            res.status(400).json({
                message: 'Data de início e fim são obrigatórias'
            });
            return;
        }
        // Buscar carros que não têm locações conflitantes
        const carros = await prisma_1.default.carro.findMany({
            where: {
                locacoes: {
                    none: {
                        OR: [
                            {
                                AND: [
                                    { dataRetirada: { lte: new Date(dataInicio) } },
                                    { dataDevolucao: { gte: new Date(dataInicio) } }
                                ]
                            },
                            {
                                AND: [
                                    { dataRetirada: { lte: new Date(dataFim) } },
                                    { dataDevolucao: { gte: new Date(dataFim) } }
                                ]
                            },
                            {
                                AND: [
                                    { dataRetirada: { gte: new Date(dataInicio) } },
                                    { dataDevolucao: { lte: new Date(dataFim) } }
                                ]
                            }
                        ]
                    }
                }
            },
            include: {
                modelo: {
                    include: {
                        marca: true
                    }
                }
            },
            orderBy: [
                { modelo: { marca: { nome: 'asc' } } },
                { modelo: { descricao: 'asc' } }
            ]
        });
        res.json(carros);
    }
    catch (error) {
        console.error('Erro ao buscar carros disponíveis:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
// Obter carro por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const carro = await prisma_1.default.carro.findUnique({
            where: { id },
            include: {
                modelo: {
                    include: {
                        marca: true
                    }
                },
                locacoes: {
                    include: {
                        usuario: {
                            select: {
                                id: true,
                                nome: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });
        if (!carro) {
            res.status(404).json({ message: 'Carro não encontrado' });
            return;
        }
        res.json(carro);
    }
    catch (error) {
        console.error('Erro ao buscar carro:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
// Criar novo carro
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { codigo, modeloId, ano, cor, descricao, observacoes } = req.body;
        if (!codigo || !modeloId || !ano || !cor || !descricao) {
            res.status(400).json({
                message: 'Código, modelo, ano, cor e descrição são obrigatórios'
            });
            return;
        }
        // Validar ano
        const anoAtual = new Date().getFullYear();
        if (ano < 1900 || ano > anoAtual + 1) {
            res.status(400).json({
                message: 'Ano deve estar entre 1900 e ' + (anoAtual + 1)
            });
            return;
        }
        // Verificar se o modelo existe
        const modelo = await prisma_1.default.modelo.findUnique({
            where: { id: modeloId },
            include: { marca: true }
        });
        if (!modelo) {
            res.status(404).json({ message: 'Modelo não encontrado' });
            return;
        }
        // Verificar se o código já existe
        const carroExistente = await prisma_1.default.carro.findUnique({
            where: { codigo }
        });
        if (carroExistente) {
            res.status(409).json({ message: 'Código do carro já cadastrado' });
            return;
        }
        const carro = await prisma_1.default.carro.create({
            data: {
                codigo,
                modeloId,
                ano: parseInt(ano),
                cor,
                descricao,
                observacoes
            },
            include: {
                modelo: {
                    include: {
                        marca: true
                    }
                }
            }
        });
        res.status(201).json(carro);
    }
    catch (error) {
        console.error('Erro ao criar carro:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
// Atualizar carro
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { codigo, modeloId, ano, cor, descricao, observacoes } = req.body;
        if (!codigo || !modeloId || !ano || !cor || !descricao) {
            res.status(400).json({
                message: 'Código, modelo, ano, cor e descrição são obrigatórios'
            });
            return;
        }
        // Validar ano
        const anoAtual = new Date().getFullYear();
        if (ano < 1900 || ano > anoAtual + 1) {
            res.status(400).json({
                message: 'Ano deve estar entre 1900 e ' + (anoAtual + 1)
            });
            return;
        }
        // Verificar se o carro existe
        const carroExistente = await prisma_1.default.carro.findUnique({
            where: { id }
        });
        if (!carroExistente) {
            res.status(404).json({ message: 'Carro não encontrado' });
            return;
        }
        // Verificar se o modelo existe
        const modelo = await prisma_1.default.modelo.findUnique({
            where: { id: modeloId },
            include: { marca: true }
        });
        if (!modelo) {
            res.status(404).json({ message: 'Modelo não encontrado' });
            return;
        }
        // Verificar se o código já está em uso por outro carro
        const carroComMesmoCodigo = await prisma_1.default.carro.findFirst({
            where: {
                codigo,
                NOT: { id }
            }
        });
        if (carroComMesmoCodigo) {
            res.status(409).json({ message: 'Código do carro já está em uso' });
            return;
        }
        const carro = await prisma_1.default.carro.update({
            where: { id },
            data: {
                codigo,
                modeloId,
                ano: parseInt(ano),
                cor,
                descricao,
                observacoes
            },
            include: {
                modelo: {
                    include: {
                        marca: true
                    }
                }
            }
        });
        res.json(carro);
    }
    catch (error) {
        console.error('Erro ao atualizar carro:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
// Deletar carro
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        // Verificar se o carro existe e se tem locações associadas
        const carro = await prisma_1.default.carro.findUnique({
            where: { id },
            include: {
                locacoes: true
            }
        });
        if (!carro) {
            res.status(404).json({ message: 'Carro não encontrado' });
            return;
        }
        // Verificar se existem locações associadas
        if (carro.locacoes.length > 0) {
            res.status(400).json({
                message: 'Não é possível excluir o carro pois existem locações associadas'
            });
            return;
        }
        await prisma_1.default.carro.delete({
            where: { id }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Erro ao deletar carro:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});
exports.default = router;
//# sourceMappingURL=carro.js.map