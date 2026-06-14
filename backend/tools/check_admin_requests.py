import os

# charger manuellement .env pour éviter la dépendance python-dotenv
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', '.env')
if os.path.exists(env_path):
    try:
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                k, v = line.split('=', 1)
                k = k.strip()
                v = v.strip().strip('\"').strip("\'")
                if k not in os.environ:
                    os.environ[k] = v
    except Exception:
        pass

import sys
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from src.models.admin_request import AdminRequestModel
from src.models.user import UserModel

print('DATABASE_URL=', os.environ.get('DATABASE_URL'))
print('\nPending requests:')
try:
    pendings = AdminRequestModel.list_pending()
    print(pendings)
except Exception as e:
    print('Error listing pendings:', e)

print('\nUsers and pending check:')
try:
    users = UserModel.find_all()
    print('Total users:', len(users))
    for u in users:
        try:
            p = AdminRequestModel.find_pending_for_user(u['id'])
        except Exception as ex:
            p = f'ERR {ex}'
        print(u['id'], u.get('username'), u.get('email'), 'role=' + str(u.get('role')), 'pending=', p)
except Exception as e:
    print('Error listing users:', e)
