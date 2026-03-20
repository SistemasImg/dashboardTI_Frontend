import {
  Card,
  CardHeader,
  Typography,
  CardBody,
} from '@material-tailwind/react';
import {
  MdEdit,
  MdDelete,
  MdVisibility,
  MdVisibilityOff,
} from 'react-icons/md';
import { useAuth } from '@/context/loginContext';
import CustomSwal from '@/utils/customSwal';
import Label from '@/widgets/forms/label';
import Select from '@/widgets/forms/select';
import Option from '@/widgets/forms/option';
import Input from '@/widgets/forms/input';
import FormButtons from '@/components/uat/FormButtons';
import { useState, useEffect, useRef } from 'react';
import { getAllRoles } from '@/services/roles/getRoles';
import { getAllCallCenters } from '@/services/callCenter/getCallCenter';
import { useUsers } from '@/context/allUsers';
import { createUser } from '@/services/users/createUser';
import { updateUsers } from '@/services/users/updateUser';
import { deleteUsers } from '@/services/users/deleteUser';
import ScaleWrapper from '@/components/ScaleWrapper';

const toTitleCase = (text) => {
  return text
    .toLowerCase()
    .split(' ')
    .filter((word) => word.trim() !== '')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const generatePassword = () => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%&*';

  const getRandom = (str) => str[Math.floor(Math.random() * str.length)];

  let password =
    getRandom(upper) +
    getRandom(lower) +
    getRandom(numbers) +
    getRandom(symbols);

  const all = upper + lower + numbers + symbols;

  while (password.length < 8) {
    password += getRandom(all);
  }

  // mezclar
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};

const generateEmail = (fullname, callCenterName) => {
  if (!fullname || !callCenterName) return '';

  const base = fullname
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .replaceAll('ñ', 'n')
    .replaceAll(/[^a-z\s]/g, '')
    .trim()
    .split(/\s+/)
    .join('.');

  let domain = callCenterName
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .replaceAll('ñ', 'n')
    .replaceAll(/[^a-z\s]/g, '')
    .replaceAll(/\s+/g, '');

  if (domain === 'img') {
    domain = 'img360';
  }

  return `${base}@${domain}.com`;
};

export function Users() {
  const { user } = useAuth();
  const createUsersRef = useRef(null);
  const { users, refreshUsers } = useUsers();
  const [localUsers, setLocalUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [callCenters, setCallCenters] = useState([]);
  const [filterRole, setFilterRole] = useState('');
  const [filterCallCenter, setFilterCallCenter] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});

  //Add status for form
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role_id, setRole_id] = useState('');
  const [status, setStatus] = useState('active');
  const [call_center_id, setCall_center_id] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const formDataUser = {
    fullname,
    email,
    password,
    role_id,
    call_center_id,
    status,
  };

  const togglePassword = (id) => {
    setShowPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  useEffect(() => {
    const base = Array.isArray(users) ? users : [];

    const orderMap = {};
    callCenters.forEach((c, index) => {
      orderMap[c.id] = index;
    });

    const filtered = base
      .filter((u) => {
        if (user?.role_id === 3) {
          const allowedRoles = [4, 5];
          if (!allowedRoles.includes(u?.Role?.id)) return false;
        }

        if (filterRole && String(u?.Role?.id) !== String(filterRole))
          return false;

        if (
          filterCallCenter &&
          String(u?.callCenter?.id) !== String(filterCallCenter)
        )
          return false;

        return true;
      })
      .sort((a, b) => {
        const orderA = orderMap[a?.callCenter?.id] ?? 999;
        const orderB = orderMap[b?.callCenter?.id] ?? 999;

        return orderA - orderB;
      });

    setLocalUsers(filtered);
  }, [users, filterRole, filterCallCenter, callCenters, user]);

  useEffect(() => {
    const selectedCallCenter = callCenters.find(
      (c) => String(c.id) === String(call_center_id)
    );

    const callCenterName = selectedCallCenter?.name;

    if (fullname && callCenterName) {
      const newEmail = generateEmail(fullname, callCenterName);
      setEmail(newEmail);
    }
  }, [fullname, call_center_id, callCenters]);

  const reloadUsers = async () => {
    try {
      await refreshUsers();
    } catch (err) {
      console.error('Error reloading users:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const payload = await getAllCallCenters();
        setCallCenters(Array.isArray(payload) ? payload : []);
        if (payload?.length > 0) {
          setCall_center_id(payload[0].id);
        }

        const data = await getAllRoles();
        setRoles(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setRoles([]);
        setCallCenters([]);
      }
    };

    fetchData();
  }, []);

  const handleEdit = (row) => {
    console.log('Editing user:', row);
    setFullname(row.fullname || '');
    setEmail(row.email || '');
    setCall_center_id(row.callCenter.id || '');
    setRole_id(row.Role.id || '');
    setStatus(row.status || 'active');
    setEditingId(row.id ?? null);
    setTimeout(() => {
      createUsersRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 10);
    setIsEditing(true);
  };

  const handleDelete = (row) => {
    CustomSwal.fire({
      title: '¿Delete user??',
      text: `Confirm deletion of ${row.fullname || 'this user'}.`,
      icon: 'warning',
      confirmButtonText: 'Yes, delete',
    }).then((result) => {
      if (result.isConfirmed) {
        deleteUsers({ id: row.id })
          .then(() => {
            CustomSwal.fire({
              icon: 'success',
              title: 'Deleted',
              text: 'User deleted',
            });
            reloadUsers();
          })
          .catch((error) => {
            CustomSwal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Error while deleting the user',
            });
            console.error('Error deleting user:', error);
          });
      }
    });
  };

  // Handler submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!fullname.trim()) errors.fullname = true;
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = true;
    if (!role_id) errors.role_id = true;
    if (!call_center_id) errors.call_center_id = true;

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      CustomSwal.fire({
        icon: 'error',
        title: 'Required Fields',
        text: 'Please fill in all required fields correctly.',
      });
      return;
    }

    const payload = { ...formDataUser };

    if (user?.role_id === 3) {
      if (![4, 5].includes(Number(role_id))) {
        CustomSwal.fire({
          icon: 'error',
          title: 'Unauthorized',
          text: 'You can only assign roles 4 or 5',
        });
        return;
      }
    }

    try {
      if (isEditing && editingId) {
        await updateUsers({ id: editingId, ...payload });
        CustomSwal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Data updated successfully',
        });
        handleCancel();
        reloadUsers();
      } else {
        await createUser(payload);
        CustomSwal.fire({
          icon: 'success',
          title: 'Created!',
          text: 'Data saved successfully',
        });
        handleCancel();
        reloadUsers();
      }
      setIsEditing(false);
      setEditingId(null);
    } catch (error) {
      CustomSwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error while saving the data',
      });
      reloadUsers();
      console.error('Error submitting user:', error);
    }
  };

  // Handler for cancel
  const handleCancel = () => {
    setFullname('');
    setEmail('');
    setCall_center_id(callCenters[0]?.id || '');
    setPassword('');
    setStatus('active');
    setRole_id('');
    setIsEditing(false);
    setEditingId(null);
  };

  return (
    <ScaleWrapper scale={0.7} buffer={40}>
      <div className="mb-8 mt-12 flex flex-col gap-8 text-sm">
        <div ref={createUsersRef} />
        <Card color="white">
          <CardHeader
            variant="gradient"
            color="gray"
            className="p-6 shadow-none"
          >
            <Typography variant="h4" color="white">
              Creates Users
            </Typography>
          </CardHeader>
          <form className="space-y-10 rounded-xl p-8" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-x-4 gap-y-6 text-xs sm:grid-cols-6 sm:text-[10px]">
              {/* Full Name */}
              <div className="sm:col-span-3">
                <Label htmlFor="fullname">Full Name</Label>
                <Input
                  id="fullname"
                  name="fullname"
                  type="text"
                  value={fullname}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(
                      /[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g,
                      ''
                    );
                    setFullname(toTitleCase(cleaned));
                    setFieldErrors((prev) => ({ ...prev, fullname: false }));
                  }}
                  className={fieldErrors.fullname ? 'border-red-500' : ''}
                />
                {fieldErrors.fullname && (
                  <span className="mt-1 block text-xs text-red-500">
                    This field is required
                  </span>
                )}
              </div>

              {/* Email */}
              <div className="sm:col-span-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, email: false }));
                  }}
                  className={fieldErrors.email ? 'border-red-500' : ''}
                />
                {fieldErrors.email && (
                  <span className="mt-1 block text-xs text-red-500">
                    This field is required
                  </span>
                )}
              </div>

              {/* Call Center ✅ */}
              <div className="sm:col-span-3">
                <Label>Call Center</Label>
                <Select
                  value={call_center_id}
                  onChange={(e) => setCall_center_id(e.target.value)}
                >
                  {callCenters.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.name}
                    </Option>
                  ))}
                </Select>
              </div>

              {/* Password */}
              <div className="sm:col-span-3">
                <Label htmlFor="password">Password</Label>

                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-24"
                  />

                  <button
                    type="button"
                    onClick={() => setPassword(generatePassword())}
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded bg-gray-800 px-2 py-1 text-xs text-white hover:bg-black"
                  >
                    Generate
                  </button>
                </div>
              </div>

              {/* Position */}
              <div className="sm:col-span-3">
                <Label htmlFor="position">Position</Label>
                <Select
                  id="idRole"
                  name="idRole"
                  value={role_id}
                  onChange={(e) => {
                    setRole_id(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, role_id: false }));
                  }}
                >
                  className={fieldErrors.role_id ? 'border-red-500' : ''}
                  <Option value="" disabled hidden>
                    Select Role
                  </Option>
                  {roles
                    .filter((r) => {
                      if (user?.role_id === 3) {
                        return [4, 5].includes(r.id);
                      }
                      return true;
                    })
                    .map((p) => (
                      <Option key={p.id} value={p.id}>
                        {p.name}
                      </Option>
                    ))}
                </Select>
                {fieldErrors.role_id && (
                  <span className="mt-1 block text-xs text-red-500">
                    This field is required
                  </span>
                )}
              </div>
            </div>

            {/* Botones */}
            <FormButtons
              isEditing={isEditing}
              editingId={editingId}
              onCancel={handleCancel}
              className="flex-col sm:flex-row"
            />
          </form>
        </Card>
        <Card>
          <CardHeader
            variant="gradient"
            color="gray"
            className="p-6 shadow-none"
          >
            <Typography variant="h4" color="white">
              Register Users
            </Typography>
          </CardHeader>

          <CardBody className="overflow-x-scroll p-8 pt-6">
            <div className="mb-8 flex flex-wrap items-end gap-4">
              <div className="w-48">
                <Label>Role</Label>
                <Select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <Option value="" disabled hidden>
                    All Roles
                  </Option>
                  {roles.map((r) => (
                    <Option key={r.id} value={r.id}>
                      {r.name}
                    </Option>
                  ))}
                </Select>
              </div>

              <div className="w-56">
                <Label>Call Center</Label>
                <Select
                  value={filterCallCenter}
                  onChange={(e) => setFilterCallCenter(e.target.value)}
                >
                  <Option value="" disabled hidden>
                    All Call Centers
                  </Option>
                  {callCenters.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.name}
                    </Option>
                  ))}
                </Select>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFilterRole('');
                  setFilterCallCenter('');
                }}
                className="flex items-center gap-2 rounded bg-gray-300 px-3 py-2"
              >
                Clear
              </button>
            </div>

            <table className="w-full min-w-[600px] table-auto border text-xs sm:text-sm">
              <thead>
                <tr>
                  <th className="border px-4 py-2">Full Name</th>
                  <th className="border px-4 py-2">Email</th>
                  <th className="border px-4 py-2">Role</th>
                  <th className="border px-4 py-2">Call Center</th>
                  <th className="border px-4 py-2">Password</th>
                  <th className="border px-4 py-2">Date of Entry</th>
                </tr>
              </thead>
              <tbody className="text-center">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-4 text-center">
                      No data available
                    </td>
                  </tr>
                ) : (
                  localUsers.map((row, idx) => (
                    <tr
                      key={row.id || idx}
                      className="transition-colors duration-200 hover:bg-blue-50"
                    >
                      <td className="border px-4 py-2">{row.fullname}</td>
                      <td className="border px-4 py-2">{row.email}</td>
                      <td className="border px-4 py-2">{row.Role.name}</td>
                      <td className="border px-4 py-2">
                        {row.callCenter.name}
                      </td>
                      <td className="border px-4 py-2">
                        <div className="flex items-center justify-center gap-2">
                          <span>
                            {showPasswords[row.id]
                              ? row.log_pass || '-'
                              : '•••••••••••••••••'}
                          </span>

                          <button
                            type="button"
                            onClick={() => togglePassword(row.id)}
                            className="text-gray-600 hover:text-black"
                            title="Show / Hide Password"
                          >
                            {showPasswords[row.id] ? (
                              <MdVisibilityOff size={18} />
                            ) : (
                              <MdVisibility size={18} />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="border px-4 py-2">
                        {row.created_at || ''}
                      </td>
                      <td className="border px-4 py-2">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            className="text-indigo-600 hover:text-indigo-900"
                            onClick={() => handleEdit(row)}
                            title="Edit"
                          >
                            <MdEdit size={20} />
                          </button>
                          <button
                            type="button"
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDelete(row)}
                            title="Delete"
                          >
                            <MdDelete size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>
    </ScaleWrapper>
  );
}

export default Users;
