import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Save, ChevronDown, ChevronUp } from 'lucide-react';
import api from '@/lib/apiClient';

interface DeliveryArea {
  id: string;
  name: string;
  pincodes: string[];
  isActive: boolean;
}

interface DeliveryAreasManagementProps {
  onClose?: () => void;
}

export const DeliveryAreasManagement: React.FC<DeliveryAreasManagementProps> = ({ onClose }) => {
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaPincodes, setNewAreaPincodes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  const [editingPincodes, setEditingPincodes] = useState<Record<string, string>>({});

  // Fetch current delivery areas
  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/admin/delivery-areas');
      if (response.data?.areas) {
        setAreas(response.data.areas);
      }
    } catch (err) {
      setError('Failed to load delivery areas');
      console.error('Error fetching areas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddArea = () => {
    const trimmedName = newAreaName.trim();
    
    if (!trimmedName) {
      setError('Area name cannot be empty');
      return;
    }

    if (areas.some(a => a.name === trimmedName)) {
      setError('This area already exists');
      return;
    }

    const pincodes = newAreaPincodes
      .split(',')
      .map(p => p.trim())
      .filter(p => /^\d{5,6}$/.test(p));

    const newArea: DeliveryArea = {
      id: Date.now().toString(),
      name: trimmedName,
      pincodes,
      isActive: true,
    };

    setAreas([...areas, newArea]);
    setNewAreaName('');
    setNewAreaPincodes('');
    setError(null);
    setSuccess(`Added "${trimmedName}" with ${pincodes.length} pincodes`);
    setTimeout(() => setSuccess(null), 2000);
  };

  const handleRemoveArea = (areaId: string) => {
    const area = areas.find(a => a.id === areaId);
    setAreas(areas.filter(a => a.id !== areaId));
    if (area) {
      setSuccess(`Removed "${area.name}"`);
      setTimeout(() => setSuccess(null), 2000);
    }
  };

  const handleUpdatePincodes = (areaId: string, pincodesStr: string) => {
    const pincodes = pincodesStr
      .split(',')
      .map(p => p.trim())
      .filter(p => /^\d{5,6}$/.test(p));

    setAreas(areas.map(a => 
      a.id === areaId ? { ...a, pincodes } : a
    ));
  };

  const handleSaveAreas = async () => {
    try {
      if (areas.length === 0) {
        setError('At least one delivery area is required');
        return;
      }

      setSaving(true);
      setError(null);

      const response = await api.put('/api/admin/delivery-areas', {
        areas: areas.map(a => ({
          id: a.id,
          name: a.name,
          pincodes: a.pincodes,
          isActive: a.isActive,
        })),
      });

      if (response.data?.areas) {
        setAreas(response.data.areas);
        setSuccess('Delivery areas saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to save delivery areas';
      setError(errorMessage);
      console.error('Error saving areas:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddArea();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading delivery areas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Delivery Areas & Pincodes Management</CardTitle>
          <CardDescription>
            Configure delivery areas and their service pincodes. Users can only order from configured pincodes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
              {success}
            </div>
          )}

          {/* Add New Area */}
          <div className="space-y-3 border-b pb-6">
            <label className="text-sm font-medium">Add New Area</label>
            <div className="space-y-2">
              <Input
                placeholder="Area name (e.g., Kurla West, Andheri, Dadar)"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Input
                placeholder="Pincodes (comma-separated, e.g., 400070, 400086, 400025)"
                value={newAreaPincodes}
                onChange={(e) => setNewAreaPincodes(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button
                onClick={handleAddArea}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Area
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Pincodes must be 5-6 digits. You can add or edit them after creating the area.
            </p>
          </div>

          {/* Current Areas List */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Configured Areas ({areas.length})
            </label>
            
            {areas.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground border border-dashed rounded-md">
                No delivery areas configured yet. Add one to get started.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {areas.map((area) => (
                  <div key={area.id} className="border rounded-lg">
                    <div
                      className="flex items-center justify-between bg-secondary/50 p-3 hover:bg-secondary transition-colors cursor-pointer"
                      onClick={() => setExpandedArea(expandedArea === area.id ? null : area.id)}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{area.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {area.pincodes.length} pincodes configured
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {expandedArea === area.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveArea(area.id);
                          }}
                          className="text-destructive hover:text-destructive/80 transition-colors p-1"
                          title="Remove area"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Area Details */}
                    {expandedArea === area.id && (
                      <div className="bg-white p-4 border-t space-y-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">
                            Edit Pincodes (comma-separated)
                          </label>
                          <Input
                            value={editingPincodes[area.id] ?? area.pincodes.join(', ')}
                            onChange={(e) => {
                              setEditingPincodes({
                                ...editingPincodes,
                                [area.id]: e.target.value
                              });
                            }}
                            onBlur={(e) => {
                              handleUpdatePincodes(area.id, e.target.value);
                              const newEditing = { ...editingPincodes };
                              delete newEditing[area.id];
                              setEditingPincodes(newEditing);
                            }}
                            placeholder="400070, 400086, 400025"
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Current: {area.pincodes.length > 0 ? area.pincodes.join(', ') : 'None'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
            <p>
              <strong>📍 How it works:</strong> When users enter a pincode on home page, we check it against these configured pincodes first. This is faster and doesn't depend on map services.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleSaveAreas}
              disabled={saving || areas.length === 0}
              className="flex-1 gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            {onClose && (
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryAreasManagement;
