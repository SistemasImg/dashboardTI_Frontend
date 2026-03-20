import {
  Card,
  CardHeader,
  CardBody,
  Typography,
} from '@material-tailwind/react';
import Label from '@/widgets/forms/label';
import Input from '@/widgets/forms/input';
import { useState, useEffect } from 'react';
import ScaleWrapper from '@/components/ScaleWrapper';
import CustomSwal from '@/utils/customSwal';
import { sendMessage } from '@/services/infobit/send.infobit';
import { getAllMessages } from '@/services/infobit/getMessages';
import { getAllUsers } from '../../services/users/getUsers';

const getStatusClasses = (status) => {
  switch (status) {
    case 'PENDING_ACCEPTED':
      return 'bg-yellow-100 text-yellow-800';
    case 'ACCEPTED':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function Infobit() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [messages, setMessages] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) {
      value = value.slice(0, 10);
    }
    setPhoneNumber(value);
    if (fieldErrors.phoneNumber) {
      setFieldErrors({ ...fieldErrors, phoneNumber: '' });
    }
  };

  const handleSendMessage = async () => {
    if (sending) return;
    const errors = {};

    if (!phoneNumber || phoneNumber.trim() === '') {
      errors.phoneNumber = 'Phone number is required';
    } else if (phoneNumber.length < 10) {
      errors.phoneNumber = 'Phone number must have 10 digits';
    }

    if (!message || message.trim() === '') {
      errors.message = 'Message is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSending(true);

    try {
      await sendMessage(phoneNumber, message);

      setPhoneNumber('');
      setMessage('');
      setFieldErrors({});

      fetchMessages();

      CustomSwal.fire({
        icon: 'success',
        title: 'Message sent',
        text: 'Your message was sent successfully.',
      });
    } catch (error) {
      console.error('Error sending message:', error);

      CustomSwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'There was an error sending the message. Please try again.',
      });
    } finally {
      setSending(false);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const data = await getAllMessages();
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const filters = {
        role_id: '4,5',
      };
      const data = await getAllUsers(filters);
      setAgents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      setAgents([]);
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchAgents();
  }, []);

  const getAgentName = (agentId) => {
    const agent = agents.find((a) => a.id === agentId);
    return agent?.fullname || '-';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <ScaleWrapper scale={0.6} buffer={40}>
      <div className="mb-8 mt-12 flex flex-col gap-12">
        <Card color="white">
          <CardHeader
            variant="gradient"
            style={{ backgroundColor: '#EEA11E' }}
            className="p-6 shadow-none"
          >
            <Typography variant="h4" color="white">
              Send Messages
            </Typography>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col gap-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Label htmlFor="phone" value="Phone Number" />
                  <div className="relative">
                    <span className="absolute left-3 top-3 font-medium text-gray-600">
                      +1
                    </span>
                    <Input
                      id="phone"
                      type="text"
                      placeholder="1234567890"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      maxLength="10"
                      className="pl-10"
                    />
                  </div>
                  {fieldErrors.phoneNumber && (
                    <p className="mt-1 text-xs font-medium text-red-600">
                      {fieldErrors.phoneNumber}
                    </p>
                  )}
                  {!fieldErrors.phoneNumber && (
                    <p className="mt-1 text-xs text-gray-500">
                      Maximum 10 digits (U.S. numbers only)
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="message" value="Message" />
                <textarea
                  id="message"
                  placeholder="Write your message here..."
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (fieldErrors.message) {
                      setFieldErrors({ ...fieldErrors, message: '' });
                    }
                  }}
                  className={`w-full rounded-md border p-3 text-sm focus:outline-none focus:ring-1 ${
                    fieldErrors.message
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
                  }`}
                  rows="4"
                />
                {fieldErrors.message && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {fieldErrors.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleSendMessage}
                  disabled={sending}
                  className={`flex items-center justify-center gap-2 rounded-md px-6 py-2 font-medium text-white transition
    ${
      sending
        ? 'cursor-not-allowed bg-gray-400'
        : 'bg-[#EEA11E] hover:bg-[#d46f1d]'
    }
  `}
                >
                  {sending && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  {sending ? 'Sending...' : 'Send Message'}
                </button>

                <button
                  disabled={sending}
                  onClick={() => {
                    setPhoneNumber('');
                    setMessage('');
                  }}
                  className={`rounded-md px-6 py-2 font-medium text-white transition
    ${sending ? 'cursor-not-allowed bg-gray-300' : 'bg-gray-400 hover:bg-gray-500'}
  `}
                >
                  Clear
                </button>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            variant="gradient"
            color="gray"
            className="flex items-center justify-between p-6"
          >
            <Typography variant="h4" color="white">
              Messages History
            </Typography>
            <button
              type="button"
              onClick={fetchMessages}
              disabled={loading}
              className={`rounded px-3 py-1 text-white transition ${
                loading
                  ? 'cursor-not-allowed bg-gray-400'
                  : 'bg-[#1A1A1A] hover:bg-[#000000]'
              }`}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </CardHeader>

          <CardBody className="overflow-x-auto p-6">
            {loading ? (
              <div className="py-8 text-center">Loading messages...</div>
            ) : (
              <table className="w-full min-w-[700px] table-auto border-collapse border-2 border-[#1A1A1A]">
                <thead className="sticky top-0 z-10 bg-[#e07721] text-white">
                  <tr className="text-center">
                    <th
                      className="border border-[#1A1A1A] px-4 py-2"
                      style={{ width: '120px' }}
                    >
                      Phone Number
                    </th>
                    <th
                      className="border border-[#1A1A1A] px-4 py-2"
                      style={{ width: '500px' }}
                    >
                      Message
                    </th>
                    <th className="border border-[#1A1A1A] px-4 py-2">
                      Agent Name
                    </th>
                    <th className="border border-[#1A1A1A] px-4 py-2">
                      Status
                    </th>
                    <th className="border border-[#1A1A1A] px-4 py-2">
                      Description
                    </th>
                    <th className="border border-[#1A1A1A] px-4 py-2">
                      Created Date
                    </th>
                  </tr>
                </thead>
                <tbody className="select-none">
                  {messages.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="border px-4 py-6 text-center text-sm text-gray-500"
                      >
                        No messages found
                      </td>
                    </tr>
                  ) : (
                    messages.map((msg, idx) => (
                      <tr
                        key={msg.id ?? idx}
                        className="text-center align-middle transition-colors odd:bg-white even:bg-gray-50 hover:bg-indigo-50"
                      >
                        <td className="align-center truncate border border-[#1A1A1A] px-4 py-2 text-center">
                          {msg.numberphone ? `+1 ${msg.numberphone}` : '-'}
                        </td>
                        <td className="align-center whitespace-pre-wrap break-words border border-[#1A1A1A] px-4 py-2 text-center">
                          {msg.message ?? '-'}
                        </td>

                        <td className="align-center border border-[#1A1A1A] px-4 py-2 text-center">
                          {getAgentName(msg.id_agent) ?? '-'}
                        </td>
                        <td className="align-center border border-[#1A1A1A] px-4 py-2 text-center">
                          <span
                            className={`rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800 `}
                            // className={`rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800 ${getStatusClasses(msg.status)}`}
                          >
                            ACCEPTED {/* {msg.status ?? '-'} */}
                          </span>
                        </td>
                        <td className="align-center whitespace-pre-wrap break-words border border-[#1A1A1A] px-4 py-2 text-center">
                          {msg.description ?? '-'}
                        </td>

                        <td className="whitespace-nowrap border  border-[#1A1A1A] px-2 py-1 text-center text-sm">
                          {formatDate(msg.created_at) ?? '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </div>
    </ScaleWrapper>
  );
}

export default Infobit;
