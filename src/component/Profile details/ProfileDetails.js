import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Save, X } from 'lucide-react';
import { API_URL } from '@/src/component/api/apiURL';
import { RxCross2 } from "react-icons/rx";

const ProfileCard = ({ title, apiPath }) => {
  const [textInput, setTextInput] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [stateList, setStateList] = useState([]);
  const [options, setOptions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editState, setEditState] = useState('');
  const [error, setError] = useState('');

  const API_URL_DATA = `${API_URL}/api/master/${apiPath}`;

  useEffect(() => {
    fetchOptions();
    if (apiPath === 'city') {
      fetchStates();
    }
  }, []);
  
  const fetchOptions = async () => {
    try {
      const res = await fetch(API_URL_DATA);
      const data = await res.json();
      setOptions(data);
    } catch (err) {
      console.error('Error fetching options:', err);
    }
  };
  
  const fetchStates = async () => {
    try {
      const res = await fetch(`${API_URL}/api/master/state`);
      const data = await res.json();
      setStateList(data);
    } catch (err) {
      console.error('Error fetching states:', err);
    }
  };
  
  const addOption = async () => {
    const trimmed = textInput.trim();
    if (!trimmed) return;

    // Check for duplicate (case-insensitive)
    const isDuplicate = options.some(
      (opt) => opt.value.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      setError('This field has already been mentioned');
      return;
    }

    const payload = apiPath === 'city'
      ? { value: trimmed, state: selectedState }
      : { value: trimmed };

    try {
      const res = await fetch(API_URL_DATA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setOptions((prev) => [...prev, data]);
      setTextInput('');
      setSelectedState('');
      setError('');
    } catch (err) {
      console.error('Error adding option:', err);
    }
  };

  const removeOption = async (id) => {
    try {
      await fetch(`${API_URL_DATA}/${id}`, { method: 'DELETE' });
      setOptions((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.error('Error deleting option:', err);
    }
  };
  
  const startEdit = (id, value, stateName = '') => {
    setEditingId(id);
    setEditText(value);
    if (apiPath === 'city') setEditState(stateName);
  };
  
  const saveEdit = async (id) => {
    const payload = apiPath === 'city'
      ? { value: editText, state: editState }
      : { value: editText };
    try {
      const res = await fetch(`${API_URL_DATA}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const updated = await res.json();
      setOptions((prev) =>
        prev.map((item) => (item._id === id ? updated : item))
      );
      setEditingId(null);
      setEditText('');
      setEditState('');
    } catch (err) {
      console.error('Error editing option:', err);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && textInput.trim() !== '' ) {
      e.preventDefault();
      addOption();
    }
  };
  
  return (
    <div className="border-1 border-black mt-[50px] p-4 sm:p-6 rounded-xl shadow-sm bg-white w-full max-w-md mx-auto transition hover:shadow-md">
      <h1 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">{title}</h1>
      
      <div className="flex flex-col gap-3 mb-3">
        {apiPath === 'city' && (
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm sm:text-base"
          >
            <option value="">Select State</option>
            {stateList.map((state) => (
              <option key={state._id} value={state.value}>
                {state.value}
              </option>
            ))}
          </select>
        )}
      
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addOption();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="flex-1">
            <input
              type="text"
              value={textInput}
              onChange={(e) => {
                setTextInput(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder="Enter new value"
              className="w-full p-3 border border-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm sm:text-base"
            />
            {error && <p className="text-xs sm:text-sm text-red-500 mt-1">{error}</p>}
          </div>
          
          <button 
            type="button"
            onClick={addOption}  
            className="bg-red-800 border-1 border-black text-white rounded-lg hover:bg-rose-700 px-4 py-2 sm:px-6 sm:py-3 transition font-medium text-sm sm:text-base whitespace-nowrap"
          >
            Add
          </button>
        </form>
      </div>
      
      {options.length > 0 && (
        <div className="flex flex-wrap gap-2 overflow-hidden">
          {options.map((option) => (
            <div key={option._id}>
              {editingId === option._id ? (
                <div className="flex flex-col sm:flex-row gap-2 p-2 border rounded-md">
                  <input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                  />
                  {apiPath === 'city' && (
                    <select
                      value={editState}
                      onChange={(e) => setEditState(e.target.value)}
                      className="p-2 border border-gray-300 rounded-md text-sm"
                    >
                      {stateList.map((s) => (
                        <option key={s._id} value={s.value}>
                          {s.value}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div className="inline-flex bg-[rgba(255,208,208,1)] items-center gap-1 sm:gap-2 p-1 sm:p-2 justify-between shadow rounded border-1 border-green-400 max-w-full overflow-hidden">
                  <span className="text-gray-800 font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-[150px]">
                    {option.value} {option.state ? `(${option.state})` : ''}
                  </span>
                  <button
                    onClick={() => removeOption(option._id)}
                    className="cursor-pointer text-black flex justify-center items-center bg-transparent flex-shrink-0"
                  >
                    <RxCross2 className='bg-transparent text-xs sm:text-sm' />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileCard;