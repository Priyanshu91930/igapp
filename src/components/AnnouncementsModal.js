import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  FlatList,
  Linking,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchAllAnnouncements } from '../services/announcementService';

export default function AnnouncementsModal({ visible, onClose }) {
  const insets = useSafeAreaInsets();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const list = await fetchAllAnnouncements();
    setAnnouncements(list);
    setLoading(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const list = await fetchAllAnnouncements();
    setAnnouncements(list);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, loadData]);

  const handleOpenLink = async (link) => {
    if (!link) return;
    try {
      await Linking.openURL(link);
    } catch (err) {
      console.log('[AnnouncementsModal] Failed to open link:', err.message);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <LinearGradient
        colors={['#1E293B', '#0F172A']}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.badgeBox}>
            <Text style={styles.badgeText}>{item.badge || '🔥 UPDATE'}</Text>
          </View>
          <Text style={styles.dateText}>{item.date || 'Recent'}</Text>
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>
        {!!item.subtitle && (
          <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
        )}

        {!!item.link && (
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.8}
            onPress={() => handleOpenLink(item.link)}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionGradient}
            >
              <Text style={styles.actionBtnText}>
                {item.buttonText || 'Open Link'}
              </Text>
              <Ionicons name="open-outline" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIconTile}>
              <Ionicons name="megaphone" size={20} color="#3B82F6" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Announcements & Updates</Text>
              <Text style={styles.headerSub}>Latest news, releases & app updates</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading && !refreshing ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Fetching announcements...</Text>
          </View>
        ) : announcements.length === 0 ? (
          <View style={styles.centerBox}>
            <Ionicons name="notifications-off-outline" size={54} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Announcements Yet</Text>
            <Text style={styles.emptySub}>
              New updates and releases from Firebase will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={announcements}
            keyExtractor={(item, index) => item.id || String(index)}
            renderItem={renderItem}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: Math.max(insets.bottom, 20) + 20 },
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#3B82F6']}
              />
            }
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconTile: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#334155',
    marginTop: 14,
  },
  emptySub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  listContent: {
    padding: 16,
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  cardGradient: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgeBox: {
    backgroundColor: '#FF5E36',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dateText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 6,
  },
  cardSubtitle: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  actionBtn: {
    borderRadius: 10,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
