# seed.py
from prisma import Prisma

def main():
    db = Prisma()
    db.connect()  # Agora roda de forma síncrona perfeita!
    
    # Busca o admin
    admin = db.usuario.find_unique(where={'email': 'admin@hirefit.com'})
    
    if not admin:
        db.usuario.create(data={
            'nome': 'Administrador Master',
            'email': 'admin@hirefit.com',
            'senha': 'rh1234',
            'role': 'admin'
        })
        print("✅ Usuário administrador master criado com sucesso!")
    else:
        print("ℹ️ O administrador já está cadastrado no banco de dados.")
        
    db.disconnect()

if __name__ == '__main__':
    main()