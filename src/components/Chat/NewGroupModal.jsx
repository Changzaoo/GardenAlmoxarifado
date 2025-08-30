import React, { useState } from 'react';
import { Users, X } from 'lucide-react';
import { twitterThemeConfig } from '../../styles/twitterThemeConfig';

const NewGroupModal = ({ isOpen, onClose, onCreateGroup, availableUsers, currentUser }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const { colors, classes } = twitterThemeConfig;

  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    onCreateGroup(groupName, selectedUsers);
    setGroupName('');
    setSelectedUsers([]);
    onClose();
  };

  const toggleUserSelection = (user) => {
    if (selectedUsers.includes(user.uid)) {
      setSelectedUsers(selectedUsers.filter(uid => uid !== user.uid));
    } else {
      setSelectedUsers([...selectedUsers, user.uid]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]`}>
      <div className={`${classes.card} p-6 w-full max-w-md`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-lg font-medium ${colors.text}`}>Novo Grupo</h3>
          <button onClick={onClose} className={`${colors.textSecondary} hover:${colors.text}`}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${colors.text} mb-2`}>
              Nome do Grupo
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className={classes.input}
              placeholder="Digite o nome do grupo"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${colors.text} mb-2`}>
              Selecione os Participantes
            </label>
            <div className={`max-h-60 overflow-y-auto ${classes.card} p-2`}>
              {availableUsers
                .filter(user => user.uid !== currentUser.uid)
                .map(user => (
                  <div
                    key={user.uid}
                    onClick={() => toggleUserSelection(user)}
                    className={`p-2 rounded cursor-pointer flex items-center space-x-2 ${
                      selectedUsers.includes(user.uid)
                        ? 'bg-[#1D9BF0] bg-opacity-10'
                        : `hover:${colors.backgroundSecondary}`
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.uid)}
                      onChange={() => {}}
                      className="rounded text-[#1D9BF0]"
                    />
                    <span className={colors.text}>{user.displayName || user.email}</span>
                  </div>
                ))}
            </div>
          </div>

          <button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedUsers.length === 0}
            className={`w-full py-2 px-4 rounded ${colors.buttonPrimary} disabled:opacity-50`}
          >
            Criar Grupo
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewGroupModal;
