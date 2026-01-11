import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Save } from 'lucide-react';
import api from '@/lib/apiClient';

interface DeliveryAreasManagementProps {
  onClose?: () => void;
}

export const DeliveryAreasManagement: React.FC<DeliveryAreasManagementProps> = ({ onClose }) => {
  const [areas, setAreas] = useState<string[]>([]);
  const [newArea, setNewArea] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    const trimmedArea = newArea.trim();
    
    if (!trimmedArea) {
      setError('Area name cannot be empty');
      return;
    }

    if (areas.includes(trimmedArea)) {
      setError('This area already exists');
      return;
    }

    setAreas([...areas, trimmedArea]);
    setNewArea('');
    setError(null);
    setSuccess(`Added "${trimmedArea}"`);
    setTimeout(() => setSuccess(null), 2000);
  };

  const handleRemoveArea = (areaToRemove: string) => {
    setAreas(areas.filter(area => area !== areaToRemove));
    setSuccess(`Removed "${areaToRemove}"`);
    setTimeout(() => setSuccess(null), 2000);
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
        areas: areas,
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
    <div className="w-full max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Delivery Areas Management</CardTitle>
          <CardDescription>
            Add or remove delivery areas. These areas will be available for customers to select during checkout.
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
          <div className="space-y-3">
            <label className="text-sm font-medium">Add New Area</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter area name (e.g., Downtown Mumbai)"
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                onClick={handleAddArea}
                variant="outline"
                size="icon"
                className="w-10 h-10"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Current Areas List */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Current Delivery Areas ({areas.length})
            </label>
            
            {areas.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground border border-dashed rounded-md">
                No delivery areas configured yet. Add one to get started.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {areas.map((area) => (
                  <div
                    key={area}
                    className="flex items-center justify-between bg-secondary/50 p-3 rounded-md hover:bg-secondary transition-colors"
                  >
                    <span className="font-medium">{area}</span>
                    <button
                      onClick={() => handleRemoveArea(area)}
                      className="text-destructive hover:text-destructive/80 transition-colors p-1"
                      title="Remove area"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Area Statistics */}
          {areas.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <strong>{areas.length}</strong> delivery areas configured and ready for customers
              </p>
            </div>
          )}

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

          {/* Info Box */}
          <div className="bg-accent/50 border border-accent rounded-md p-3 text-sm text-muted-foreground">
            <p>
              <strong>💡 Tip:</strong> Changes are saved to the server. Customers will see the updated list on their next checkout.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryAreasManagement;
