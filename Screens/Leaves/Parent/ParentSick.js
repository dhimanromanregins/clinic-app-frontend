import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ToastAndroid, Modal, FlatList } from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode";
import { BASE_URL } from '../../../Actions/Api';
import { useFocusEffect } from '@react-navigation/native';



const ParentSick = ({ navigation }) => {
  const [kids, setKids] = useState([{ name: '' }]);
  const [parentName, setParentName] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [sender, setSender] = useState('');
  const [language, setLanguage] = useState('en');
  const [isModalVisible, setIsModalVisible] = useState(false);

  const ParentSickLeave = language === 'en' ? 'Parent Sick Leave' : 'الإجازة المرضية للوالدين';
  const KidName = language === 'en' ? 'Kid Name' : 'أسم الطفل';
  const From = language === 'en' ? 'From' : 'من';
  const To = language === 'en' ? 'To' : 'ل';
  const Apply = language === 'en' ? 'Apply' : 'قدم الطلب';
  const ParentName = language === 'en' ? 'Doctor Name' : 'اسم الوالدين';
  const Note1 = language === 'en' ? 'Note: Sick leave is only issued upon medical examination or remote treatment. You will receive the sick leave within 12 working hours if it is approved.' : 'ملاحظة يتم أستخراج الطلب  فقط لمن رافق الطفل في معاينه او مراجعه طبيه';  
  const Note2 = language === 'en' ? 'You will receive a companion leave if it is approved within 24 working hours.' : 'سيصلك الكتاب حال تم الموافقة خلال 24 ساعه';  
  const toggleLanguage = async (selectedLanguage) => {
    try {
      setLanguage(selectedLanguage);
      await AsyncStorage.setItem('selectedLanguage', selectedLanguage);
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error saving language to local storage:', error);
    }
  };
  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ur', label: 'العربية' },
  ];

  useFocusEffect(
    useCallback(() => {
      const loadSelectedLanguage = async () => {
        try {
          const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
          if (savedLanguage) {
            setLanguage(savedLanguage);
            console.log(`Loaded language from storage: ${savedLanguage}`); // Debugging log
          }
        } catch (error) {
          console.error('Error loading language from local storage:', error);
        }
      };

      loadSelectedLanguage(); // Invoke the function to load the language
    }, [])
  );
  
  const handleAddKid = () => {
    setKids([...kids, { name: '' }]);
  };

  const handleInputChange = (index, value) => {
    const newKids = [...kids];
    newKids[index].name = value;
    setKids(newKids);
  };

  const handleRemoveKid = (index) => {
    const newKids = kids.filter((_, i) => i !== index);
    setKids(newKids);
  };

  const handleSubmit = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('access_token');
      const decodedToken = jwtDecode(accessToken);
      const userId = decodedToken.user_id;
      console.log(userId, "999999999")
      const childNames = kids.map(kid => kid.name);
      const data = {
        user:userId, 
        child_name: childNames.join(', '), 
        sent_to: sentTo,
        sender: sender,
      };

      const response = await fetch(`${BASE_URL}/api/parent-sick-leave/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (response.ok) {
        ToastAndroid.show('Sick leave applied successfully', ToastAndroid.SHORT);
        navigation.goBack();
      } else {
        ToastAndroid.show('Failed to apply for sick leave: ' + responseData.message, ToastAndroid.LONG);
      }
    } catch (error) {
      console.error(error);
      ToastAndroid.show('An error occurred while applying for sick leave.', ToastAndroid.LONG);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header Section - Full width */}
      <View style={styles.header}>
        {/* Language Switcher Icon */}
        <TouchableOpacity 
          style={styles.languageIcon} 
          onPress={() => setIsModalVisible(true)}
        >
          <MaterialIcons name="language" size={34} color="white" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity 
        onPress={() => navigation.goBack()} 
        style={styles.backButton}
      >
        <FontAwesome name="angle-left" size={34} color="rgba(24,212,184,255)" />
      </TouchableOpacity>

      {/* Scrollable Content */}
      <ScrollView style={styles.container}>
      <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <FlatList
                data={languages}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => toggleLanguage(item.code)} style={styles.languageOption}>
                    <Text style={styles.languageText}>{item.label}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.code}
              />
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* Title Section */}
        <View style={styles.textSection}>
          <Text style={styles.text}>{ParentSickLeave}</Text>
          <View style={styles.borderLine} />
        </View>

        {/* Parent Name Section */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{ParentName}</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Enter Parent Name" 
            value={parentName}
            onChangeText={setParentName}
            placeholderTextColor="#fff" // Change placeholder color here
            color="#fff"
          />
        </View>

        {/* Kid Names Section - Dynamic Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{KidName}</Text>
          {kids.map((kid, index) => (
            <View key={index} style={styles.row}>
              <TextInput
                style={styles.input}
                placeholder={`Enter Kid's Name`}
                value={kid.name}
                onChangeText={(value) => handleInputChange(index, value)}
                placeholderTextColor="#fff" // Change placeholder color here
                color="#fff"
              />
              {index !== 0 && (
                <TouchableOpacity 
                  style={styles.closeButton} 
                  onPress={() => handleRemoveKid(index)}
                >
                  <MaterialIcons name="close" size={24} color="white" />
                </TouchableOpacity>
              )}
              {index === kids.length - 1 && (
                <TouchableOpacity style={styles.plusButton} onPress={handleAddKid}>
                  <MaterialIcons name="add" size={24} color="white" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* To and From Section */}
        <View style={styles.row}>
          <View style={styles.inputGroupHalf}>
            <Text style={styles.label}>{To}</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Enter To" 
              value={sentTo}
              onChangeText={setSentTo}
              placeholderTextColor="#fff" // Change placeholder color here
              color="#fff"
            />
          </View>
          <View style={styles.inputGroupHalf}>
            <Text style={styles.label}>{From}</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Enter From" 
              value={sender}
              onChangeText={setSender}
              placeholderTextColor="#fff" // Change placeholder color here
              color="#fff"
            />
          </View>
        </View>

        {/* Additional Notes Section */}
        <View style={styles.inputGroup}>
          <Text style={styles.note}>
            {Note1}
          </Text>

          <Text style={styles.note}>
            {Note2}
          </Text>
        </View>

        {/* Apply Button */}
        <TouchableOpacity style={styles.applyButton} onPress={handleSubmit}>
          <Text style={styles.applyButtonText}>{Apply}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    width: '100%',
    backgroundColor: 'rgba(24,212,184,255)', 
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row', 
    alignItems: 'center',
  },
  languageIcon: {
    marginRight: 15,
  },
  backButton: {
    marginLeft: 10,
  },
  textSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2a4770',
  },
  borderLine: {
    height: 4,
    backgroundColor: '#2a4770',
    marginTop: 10,
    alignSelf: 'stretch', // Ensures it spans the parent's full width
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputGroupHalf: {
    width: '48%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2a4770',
    marginBottom: 5,
    textAlign: 'right',
    justifyContent: 'flex-end',
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 10,
    fontSize: 16,
    backgroundColor: '#2a4770',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Ensures even spacing between items
  },
  plusButton: {
    width: 40,
    height: 40,
    backgroundColor: '#2a4770',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginRight: 10,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  applyButton: {
    backgroundColor: 'rgba(24,212,184,255)',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  applyButtonText: {
    color: '#2a4770',
    fontSize: 18,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 16,
    color: '#2a4770',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // Background overlay
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
  },
  languageOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  languageText: {
    fontSize: 18,
    color: 'black',
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#24d4b8',
    borderRadius: 5,
    alignItems: 'center',
  },
});

export default ParentSick;
