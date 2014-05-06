var SpaceManager = (function ($) {
	var module = {};
	
	var DUR_REGEXP=new RegExp('^(-)?P(?:(\\d+)Y)?(?:(\\d+)M)?(?:(\\d+)D)?(T(?:(\\d+)H)?(?:(\\d+)M)?(?:(\\d+(?:\\.\\d+)?)S)?)?$');
	var connectionHandler = null, spaceHandler = null, dataHandler = null;
	var currentUserInfo = null;
	var selectedSpace = null;
	var lastDataObject = null;
	var dataObjects = null;
	var bPopupOptions = {};
	var templates = {};
	
	$(document).ready(
		function () {
			if (!("APP_CONSTANTS" in window)) {
				setView('EMPTY');
				showError('ERROR: The application is not properly configured!');
				return;
			}
			initializeTemplates();
			initializeInputHandlers();
			if (APP_CONSTANTS.DOMAIN) {
				$('#domainInput').val(APP_CONSTANTS.DOMAIN);
				$('#domainInput').prop('disabled', true);	
			} else {
				$('#domainInput').prop('disabled', false);
			}
			
			setView('LOGIN');
			switch (getURLParameter('layer')) {
			case 'none':
				bPopupOptions.opacity = 0.0;
				break;
			case 'weak':
				bPopupOptions.opacity = 0.2;
				break;
			default:
				bPopupOptions.opacity = 0.7;
			} 
		}
	);
	
	function getURLParameter(name) {
    	return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
	}
	
	function initializeTemplates() {
		templates.dataObject = Handlebars.compile($('#dataObjectTemplate').html());
	}
	
	function initializeInputHandlers() {
		$('#loginButton').bind('click', {createUser: false}, loginUser);
		$('#createUserButton').bind('click', {createUser: true}, loginUser);
		$('#showProfile').click(function() {
			setView('MAIN');
		});
		$('#selectSpaceButton').click(function selectSpace() {
			var spaceId = $('#spaceSelectionDropdown').find(":selected").val();
			indicateActivity(true);
			spaceHandler.getSpace(spaceId, function(space) {
				setSelectedSpace(space);
				indicateActivity(false);
			}, function(error) {
				indicateActivity(false);
				console.log('Failed to retrieve space: ' + spaceId, error);
				showError('Failed to retrieve space: ' + spaceId);
			});
		});
		$('#logoutButton').click(logoutUser);
		$('#dismissErrorButton').click(resetError);
		$('#dismissSuccessButton').click(resetSuccess);
		
		$('#userProfileTab ul li a').click(function(event) {
			setTab('userProfileTab', event.target.getAttribute('href').substring(1));
		});

		$('#changePasswordButton').click(function() {
			$('#changePasswordInputField').val('');
			$('#changePasswordInputField2').val('');
			$('#changePasswordInputPopup').bPopup(bPopupOptions);
			$('#changePasswordInputField').focus();
		});
		$('#changePasswordInputCancelButton').click(function() {
			$('#changePasswordInputPopup').bPopup().close();
		});
		$('#changePasswordInputSubmitButton').click(function() {
			var newPassword = $('#changePasswordInputField').val();
			var repeatedPassword =$('#changePasswordInputField2').val();
			if (newPassword && newPassword.length > 0 && newPassword == repeatedPassword) {
				changePassword(newPassword);
			} else {
				showError('Failed to update the password. Validate your input.');
			}
			$('#changePasswordInputPopup').bPopup().close();
		});
		
		$('#setProfileFullNameButton').click(function() {
			$('#profileFullNameInputField').val(currentUserInfo.vCard.getElementsByTagName('FN')[0].textContent);
			$('#profileFullNameInputPopup').bPopup(bPopupOptions);
			$('#profileFullNameInputField').focus();
		});
		$('#profileFullNameInputCancelButton').click(function() {
			$('#profileFullNameInputPopup').bPopup().close();
		});
		$('#profileFullNameInputSubmitButton').click(function() {
			var newFullName = $('#profileFullNameInputField').val();
			if (newFullName && newFullName.length > 0) {
				currentUserInfo.vCard.getElementsByTagName('FN')[0].textContent = newFullName;
			} else {
				currentUserInfo.vCard.getElementsByTagName('FN')[0].textContent = null;
			}
			updateVCard();
			$('#profileFullNameInputPopup').bPopup().close();
		});
		
		$('#setProfileOrgButton').click(function() {
			$('#profileOrgInputField').val("foo");
			$('#profileOrgInputPopup').bPopup(bPopupOptions);
			$('#profileOrgInputField').focus();
		});
		$('#profileOrgInputCancelButton').click(function() {
			$('#profileOrgInputPopup').bPopup().close();
		});
		$('#profileOrgInputSubmitButton').click(function() {
			// todo write vcard
			$('#profileOrgInputPopup').bPopup().close();
		});

		$('#setProfileOrgUnitButton').click(function() {
			$('#profileOrgUnitInputField').val("foo");
			$('#profileOrgUnitInputPopup').bPopup(bPopupOptions);
			$('#profileOrgUnitInputField').focus();
		});
		$('#profileOrgUnitInputCancelButton').click(function() {
			$('#profileOrgUnitInputPopup').bPopup().close();
		});
		$('#profileOrgUnitInputSubmitButton').click(function() {
			// todo write vcard
			$('#profileOrgUnitInputPopup').bPopup().close();
		});
		
		$('#spaceInformationTab ul li a').click(function(event) {
			setTab('spaceInformationTab', event.target.getAttribute('href').substring(1));
		});
		
		$('#setSpaceNameButton').click(function() {
			if (!selectedSpace) {
				return;
			}
			$('#spaceNameInputField').val(selectedSpace.getName());
			$('#spaceNameInputPopup').bPopup(bPopupOptions);
			$('#spaceNameInputField').focus();
		});
		$('#spaceNameInputCancelButton').click(function() {
			$('#spaceNameInputPopup').bPopup().close();
		});
		$('#spaceNameInputSubmitButton').click(function() {
			var newName = $('#spaceNameInputField').val();
			if (newName && newName != selectedSpace.getName()) {
				setSpaceName(newName);
			}
			$('#spaceNameInputPopup').bPopup().close();
		});
		
		$('#setSpacePersistenceButton').click(function() {
			if (!selectedSpace) {
				selectedSpace;
			}
			if (selectedSpace.getPersistenceDuration()) {
				$('#spacePersistenceDurationForm').show();
				var durationArray = selectedSpace.getPersistenceDuration().split(DUR_REGEXP);
				$('#spacePersistenceYearsInput').val(durationArray[2] ? durationArray[2] : '0');
				$('#spacePersistenceMonthsInput').val(durationArray[3] ? durationArray[3] : '0');
				$('#spacePersistenceDaysInput').val(durationArray[4] ? durationArray[4] : '0');
				$('#spacePersistenceHoursInput').val(durationArray[6] ? durationArray[6] : '0');
				$('#spacePersistenceMinutesInput').val(durationArray[7] ? durationArray[7] : '0');
				$('#spacePersistenceSecondsInput').val(durationArray[8] ? durationArray[8] : '0');
			} else {
				$('#spacePersistenceDurationForm').hide();
				$('#spacePersistenceYearsInput').val('0');
				$('#spacePersistenceMonthsInput').val('0');
				$('#spacePersistenceDaysInput').val('0');
				$('#spacePersistenceHoursInput').val('0');
				$('#spacePersistenceMinutesInput').val('0');
				$('#spacePersistenceSecondsInput').val('0');
			}
			$('#spacePersistenceTypeSelector').val(selectedSpace.getPersistenceType());
			$('#spacePersistencePopup').bPopup(bPopupOptions);
		});
		$('#spacePersistenceTypeSelector').change(function(event) {
			if ($('#spacePersistenceTypeSelector').val() == SpacesSDK.PersistenceType.DURATION) {
				$('#spacePersistenceDurationForm').show();
			} else {
				$('#spacePersistenceDurationForm').hide();
			}
		});
		$('#spacePersistenceInputCancelButton').click(function() {
			$('#spacePersistencePopup').bPopup().close();
		});
		$('#spacePersistenceInputSubmitButton').click(function() {
			switch ($('#spacePersistenceTypeSelector').val()) {
				case SpacesSDK.PersistenceType.ON:
					setSpacePersistence(SpacesSDK.PersistenceType.ON);
					break;
				case SpacesSDK.PersistenceType.OFF:
					setSpacePersistence(SpacesSDK.PersistenceType.OFF);
					break;
				case SpacesSDK.PersistenceType.DURATION:
					var durationArray = [
						$('#spacePersistenceYearsInput').val(),
						$('#spacePersistenceMonthsInput').val(),
						$('#spacePersistenceDaysInput').val(),
						$('#spacePersistenceHoursInput').val(),
						$('#spacePersistenceMinutesInput').val(),
						$('#spacePersistenceSecondsInput').val()
					];
					var isDurationSet = false;
					for (var i = 0; i < 6; i++) {
						if (durationArray[i] && parseInt(durationArray[i]) > 0) {
							isDurationSet = true;
							continue;
						}
					}
					if (isDurationSet) {
						setSpacePersistence(SpacesSDK.PersistenceType.DURATION, durationArray);
					} else {
						showError('Space persistence setting was not applied: Invalid duration.');
					}
					break;
			}
			$('#spacePersistencePopup').bPopup().close();
		});
		
		$('#newUserAddButton').click(function() {
			var uid = $('#newUserId').val();
			var domain = $('#newUserDomain').val();
			var role = $('#newUserRole').val();
			
			if (uid && domain) {
				addMemberToSpace(uid + '@' + domain, role);
			} else {
				showError('Both user-id and domain are required for a new space member.');
			}
		});
		
		$('#newModelAddButton').click(function() {
			var namespace = $('#newModelNamespaceInput').val();
			var schemaLocation = $('#newModelSchemaLocationInput').val();
			if (namespace && schemaLocation) {
				addDataModelSupport(namespace, schemaLocation);
			} else {
				showError('Both the namespace and an schema location is required for a data model to be supported.');
			}
		});
		
		$('#refeshSpacesListButton').click(function() {
			spaceHandler.getSpacesList(updateSpacesList, function(error) {
				console.log('Failed to retrieve list of available spaces.', error);
				showError('Failed to retrieve list of available spaces.');
			});
		});
		
		$('#spaceCreationPersistenceDurationForm input[type=number]').val(0);
				
		$('#createSpaceButton').click(function() {
			$('#spaceCreationPersistenceDurationForm').hide();
			$('#spaceCreationErrorMessage').hide();
			$('#spaceCreationNameInput').val('');
			$('#spaceCreationWizard').bPopup(bPopupOptions);
			$('#spaceCreationNameInput').focus();
		});
		
		$('#spaceCreationPersistenceTypeSelector').change(function() {
			if ($('#spaceCreationPersistenceTypeSelector').val() == SpacesSDK.PersistenceType.DURATION) {
				$('#spaceCreationPersistenceDurationForm').show();
			} else {
				$('#spaceCreationPersistenceDurationForm').hide();
			}
		});
		
		$('#spaceCreationCancelButton').click(function() {
			$('#spaceCreationWizard').bPopup().close();
		});
		
		$('#spaceCreationSubmitButton').click(function() {
			var spaceName = $('#spaceCreationNameInput').val();
			if (!spaceName) {
				$('#spaceCreationErrorMessage').text('Please enter a name for this space.').show();
				$('#spaceCreationNameInput').focus();
				return;
			}
			var spaceType = $('input[name=spaceCreationType]:checked').val();
			var durationArray = [$('#spaceCreationPersistenceYearsInput').val(),
				$('#spaceCreationPersistenceMonthsInput').val(),
				$('#spaceCreationPersistenceDaysInput').val(),
				$('#spaceCreationPersistenceHoursInput').val(),
				$('#spaceCreationPersistenceMinutesInput').val(),
				$('#spaceCreationPersistenceSecondsInput').val()];
			var persistenceType = $('#spaceCreationPersistenceTypeSelector').val();
			if (persistenceType == SpacesSDK.PersistenceType.DURATION) {
				var isDurationSet = false;
				for (var i = 0; i < 6; i++) {
					if (durationArray[i] && parseInt(durationArray[i]) > 0) {
						isDurationSet = true;
						continue;
					}
				}
				if (!isDurationSet) {
					$('#spaceCreationErrorMessage').text('Please specify a valid duration.').show();
					$('#spaceCreationPersistenceYearsInput').focus();
					return;
				}
			}
			
			createSpace(spaceName, spaceType, persistenceType, durationArray);
			$('#spaceCreationWizard').bPopup().close();
		});
		$('#sendPingButton').click(publishPingOnSpace);
		$('#dataObjectInfoPopupCloseButton').click(function() {
			$('#dataObjectInfoPopup').bPopup().close();
		});
		
		$('#deleteSpaceButton').click(function() {
			$('#deleteSpaceNameInfo').text(selectedSpace.getName() + ' (' + selectedSpace.getId() + ')');
			$('#deleteSpacePopup').bPopup(bPopupOptions);
		});
		$('#deleteSpaceCancelButton').click(function() {
			$('#deleteSpacePopup').bPopup().close();
		});
		$('#deleteSpaceSubmitButton').click(function() {
			deleteSpace();
			$('#deleteSpacePopup').bPopup().close();
		});
	}
	
	function setView(view) {
		 switch (view) {
		 	case 'EMPTY': {
				$('#loginPanel').hide();
				$('#logoutPanel').hide();
				$('#privateSpacePanel').hide();
				$('#spaceSelectionPanel').hide();
				$('#spaceInformationPanel').hide();
				$('#userProfilePanel').hide();
				break;
		 	}
			case 'LOGIN':
				$('#loginPanel').show();
				$('#logoutPanel').hide();
				$('#privateSpacePanel').hide();
				$('#spaceSelectionPanel').hide();
				$('#spaceInformationPanel').hide();
				$('#userProfilePanel').hide();
				break;
			case 'MAIN':
				$('#loginPanel').hide();
				$('#logoutPanel').show();
				$('#privateSpacePanel').show();
				$('#spaceSelectionPanel').show();
				$('#spaceInformationPanel').hide();
				$('#userProfilePanel').show();
				break;
			case 'SPACE_SELECTED':
				$('#loginPanel').hide();
				$('#logoutPanel').show();
				$('#privateSpacePanel').show();
				$('#spaceSelectionPanel').show();
				$('#spaceInformationPanel').show();
				$('#userProfilePanel').hide();
				break;
		}
		
		// update context dependend views
		if (selectedSpace) {
			$('.excludesPrivateSpace').show();
			$('.excludesTeamSpace').show();
			$('.excludesOrgaSpace').show();
			$('.excludesRoleMember').show();
			$('.excludesSpacePersistenceTypeOff').show();
			switch (selectedSpace.getType()) {
			case SpacesSDK.Type.PRIVATE:
				$('.excludesPrivateSpace').hide();
				break;
			case SpacesSDK.Type.TEAM:
				$('.excludesTeamSpace').hide();
				break;
			case SpacesSDK.Type.ORGA:
				$('.excludesOrgaSpace').hide();
				break;
			default:
				$('.privateSpaceOnly').hide();
				$('.teamSpaceOnly').hide();
				$('.orgaSpaceOnly').hide();
			
			}
			if (currentUserInfo && !selectedSpace.isModerator(currentUserInfo.getBareJID())) {
				$('.excludesRoleMember').hide();
			}
			if (selectedSpace.getPersistenceType() == SpacesSDK.PersistenceType.OFF) {
				$('.excludesSpacePersistenceTypeOff').hide();
			}
		}
	}
	
	function setTab(id, tabRef) {
		$('#' + id + ' ul li a[href="#' + tabRef + '"]').addClass('current');
		$('#' + id + ' ul li a[href!="#' + tabRef + '"]').removeClass('current');
		$('#' + id + ' > div').hide();
		$('#' + id + tabRef).show();
	}
	
	function showError(message) {
		$('#errorMessagePanel').show();
		if (message) {
			$('#errorMessageLabel').html(message);
		} else {
			$('#errorMessageLabel').html('An error occurred!');
		}
	}
	
	function showSuccess(message) {
		$('#successMessagePanel').show();
		if (message) {
			$('#successMessageLabel').html(message);
		} else {
			$('#successMessageLabel').html('Success!');
		}
	}
	
	function resetError() {
		$('#errorMessagePanel').hide();
	}
	
	function resetSuccess() {
		$('#successMessagePanel').hide();
	}
	
	function indicateActivity(isActive) {
		if (isActive == true) {
			$('#activityIndicatorLayer').show();
			$('#body').activity();
		} else {
			$('#activityIndicatorLayer').hide();
			$('#body').activity(false);
		}
	}
	
	function loginUser(event) {
		resetError();
		resetSuccess();
		var userName = $('#userNameInput').val();
		var userPwd = $('#userPwdInput').val();
		var domain = $('#domainInput').val();
		if (!userName || !userPwd || !domain) {
			showError('Failed to login: Domain, user name, and password are required!');
			return;
		}
		var configBuilder = new SpacesSDK.ConnectionConfigurationBuilder(domain, APP_CONSTANTS.APP_ID);
		connectionHandler = new SpacesSDK.ConnectionHandler(userName, userPwd, configBuilder.build(), APP_CONSTANTS.HTTP_BIND);
		var connectionStatusListener = new SpacesSDK.ConnectionStatusListener("CSL", connectionStatusChanged);
		connectionHandler.addConnectionStatusListener(connectionStatusListener);
		try {
			indicateActivity(true);
			console.log('Trying to establish connection ...');
			if (event.data.createUser) {
				connectionHandler.connectAndCreateUser();
			} else {
				connectionHandler.connect();
			}
			
		} catch (e) {
			console.log('Failed to establish a connection!', e);
			showError('Failed to establish a connection!');
		}
	}
	
	function logoutUser() {
		indicateActivity(false);
		if (connectionHandler) {
			connectionHandler.disconnect();
		}
	}
	
	function connectionStatusChanged(status) {
		console.log('Connection status changed: ' + status);
		resetError();
		resetSuccess();
		switch (status) {
			case SpacesSDK.ConnectionStatus.OFFLINE:
				indicateActivity(false);
				if (dataHandler) {
					dataHandler.removeDataObjectListener({name:'DOL'});
				}
				$('loginButton').removeAttr('disabled');
				showError('The connection was closed.');
				setView('LOGIN');
				break;
			case SpacesSDK.ConnectionStatus.ERROR:
				indicateActivity(false);
				$('loginButton').removeAttr('disabled');
				showError('Connection error!');
				setView('LOGIN');
				break;
			case SpacesSDK.ConnectionStatus.PENDING:
				$('loginButton').attr('disabled');
				break; 
			case SpacesSDK.ConnectionStatus.ONLINE:
				indicateActivity(false);
				$('loginButton').removeAttr('disabled');
				currentUserInfo = connectionHandler.getCurrentUser();
				$('#userInfoLabel').html(currentUserInfo.getBareJID().split('@')[0]);
				// load user profile
				initializeUserProfile();
				// initialize handlers fo the spaces SDK
				if (!connectionHandler) {
					console.log('Failed to initialize space handler: No connection.');
				}
				spaceHandler = new SpacesSDK.SpaceHandler(connectionHandler);
				dataHandler = new SpacesSDK.DataHandler(connectionHandler, spaceHandler);
				var dataObjectListener = new SpacesSDK.DataObjectListener('DOL', function(dataObject, spaceId) {
					if (selectedSpace && selectedSpace.getId() == spaceId) {
						renderNewDataObject(dataObject);
						dataObjects.push(dataObject);
					} else {
						console.warn('Received data object, but no space or another space is selected:', dataObject);
					}
				});
				dataHandler.addDataObjectListener(dataObjectListener);
				indicateActivity(true);
				spaceHandler.getDefaultSpace(function(space) {
					indicateActivity(false);
					updatePrivateSpaceInfo(space);
				}, function(error) {
					indicateActivity(false);
					console.log('Failed to retrieve private space.', error);
					showError('Failed to retrieve information about private space.');
				});
				
				spaceHandler.getSpacesList(updateSpacesList, function(error) {
					console.log('Failed to retrieve list of available spaces.', error);
					showError('Failed to retrieve list of available spaces.');
				});
				
				setView('MAIN');
				break;
		}
	}
	
	function initializeUserProfile() {
		$('#profileUserId').text(currentUserInfo.getUsername());
		var xmppConn = connectionHandler.getXMPPConnection();
		xmppConn.vcard.get(function (stanza) {
			var vCard = stanza.getElementsByTagName('vCard')[0];
			if (vCard.getElementsByTagName('FN').length > 0) {
				$('#profileFullName').text(vCard.getElementsByTagName('FN')[0].textContent);
			} else {
				$('#profileFullName').html('&nbsp;');
				var fnElement = vCard.ownerDocument.createElement('FN');
				if (vCard.childElementCount > 0) {
					vCard.insertBefore(fnElement, vCard.firstChild);
				} else {
					vCard.appendChild(fnElement);
				}
			}
			currentUserInfo.vCard = vCard;
		}, currentUserInfo.getBareJID());
	}
	
	function updateVCard() {
		var builder = $build('vCard');
		var xmppConn = connectionHandler.getXMPPConnection();
		xmppConn.vcard.set(function(result) {
			console.log('The vCard was sucessfully updated.');
			var fullNameTag = currentUserInfo.vCard.getElementsByTagName('FN')[0];
			$('#profileFullName').text(fullNameTag.textContent);
		}, currentUserInfo.vCard, currentUserInfo.getBareJID(), function(error) {
			console.warn('Failed to write vCard:', error);
		});
	}
	
	function createSpace(name, type, persistenceType, persistenceDurationArray) {
		var moderator = new SpacesSDK.SpaceMember(currentUserInfo.getBareJID(), SpacesSDK.Role.MODERATOR);
		var durationString = null;
		if (type == SpacesSDK.PersistenceType.DURATION) {
			durationString = 'P' + persistenceDurationArray[0] + 'Y' + persistenceDurationArray[1] + 'M' + persistenceDurationArray[2] + 'D';
			durationString += 'T' + persistenceDurationArray[3] + 'H' + persistenceDurationArray[4] + 'M' + duratpersistenceDurationArrayionArray[5] + 'S';
		}
		var spaceConfiguration = new SpacesSDK.SpaceConfiguration(type, name, [moderator], persistenceType, durationString);
		
		indicateActivity(true);
		spaceHandler.createSpace(spaceConfiguration, function(space) {
			setSelectedSpace(space);
			spaceHandler.getSpacesList(updateSpacesList, function(error) {
				console.log('Failed to retrieve list of available spaces.', error);
				showError('Failed to retrieve list of available spaces.');
			});
			indicateActivity(false);
		}, function(error) {
			indicateActivity(false);
			console.log('Failed to create space.', error);
			showError('Failed to create space.');
		});
	}
	
	function updatePrivateSpaceInfo(space) {
		if (space) {
			var infoText = 'Private space available.';
			switch (space.getPersistenceType()) {
			case 'ON':
				infoText += ' Private data is persisted.';
				break;
			case 'DURATION':
				infoText += ' Private data is temporary persisted.';
				break;
			case 'OFF':
				infoText += ' Private data is not persisted.';
				break;
			}
			$('#privateSpaceInformation').text(infoText);
			$('#privateSpaceDetailsButton')
				.html('Details')
				.unbind('click')
				.bind('click', function() {
					indicateActivity(true);
					spaceHandler.getDefaultSpace(function(privateSpace) {
						setSelectedSpace(privateSpace);
						indicateActivity(false);
					}, function(error) {
						indicateActivity(false);
						console.log('Failed to retrieve private space.', error);
						showError('Failed to retrieve private space.');
					});
				});
		} else {
			$('#privateSpaceInformation').text('No private space available.');
			$('#privateSpaceDetailsButton')
				.html('Create')
				.unbind('click')
				.bind('click', 	function() {
					indicateActivity(true);
					spaceHandler.createDefaultSpace(function(space) {
						updatePrivateSpaceInfo(space);
						setSelectedSpace(space);
						indicateActivity(false);
					}, function(error){
						indicateActivity(false);
						console.log('Failed to create private space.', error);
						showError('Failed to create private space.');
					});
				});
		}
	}
	
	/**
	 * Call back for space handler "getSpacesList". 
	 */
	function updateSpacesList(spacesList) {
		if (Object.keys(spacesList).length == 0 || (Object.keys(spacesList).length == 1 && spacesList[currentUserInfo.getUsername()])) {
			$('#noSharedSpacesInfo').show();
			$('#sharedSpaceSelectionForm').hide();
		} else {
			$('#noSharedSpacesInfo').hide();
			$('#sharedSpaceSelectionForm').show();
			
			var spaceSelectionDropdown = $('#spaceSelectionDropdown');
			spaceSelectionDropdown.empty();

			var availableSpacesList = [];
			$.each(spacesList, function(id, name) {
				availableSpacesList.push({id: id, name: name});
			});
			$.each(availableSpacesList.sort(function(a, b) {
				var aName = a.name.toLowerCase();
				var bName = b.name.toLowerCase();
				return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
			}), function(index, space) {
				if (space.id == currentUserInfo.getUsername()) {
					return;
				}
				var option = $('<option></option>').val(space.id).html(space.name + ' (' + space.id + ')');
				spaceSelectionDropdown.append(option);
			});
		}
	}
	
	function unselectSpace() {
		if (dataHandler && selectedSpace) {
			dataHandler.removeSpace(selectedSpace.getId());
		}	
		selectedSpace = null;		
	}
	
	function setSelectedSpace(space) {
		unselectSpace();
		selectedSpace = space;
		$('#spaceInformationPanel > .panelHeader').text('Space Information: ' + space.getName() + ' (' + space.getId() + ')');
		var isModerator = space.isModerator(currentUserInfo.getBareJID());
		$('#selectedSpaceId').text(space.getId());
		$('#selectedSpaceName').text(space.getName());
		switch (space.getType()) {
		case SpacesSDK.Type.PRIVATE:
			$('#selectedSpaceType').text("Private Space");
			break;
		case SpacesSDK.Type.TEAM:
			$('#selectedSpaceType').text("Team Space");
			break;
		case SpacesSDK.Type.ORGA:
			$('#selectedSpaceType').text("Organizational Space");
			break;
		}
		$('#selectedSpaceMembersCount').text(space.getMembers().length);
		switch (space.getPersistenceType()) {
		case SpacesSDK.PersistenceType.ON:
			$('#selectedSpacePersistence').html("Data is persisted.");
			break;
		case SpacesSDK.PersistenceType.OFF:
			$('#selectedSpacePersistence').html("Data is <b>not</b> persisted.");
			break;
		case SpacesSDK.PersistenceType.DURATION:
			var durationInfo = 'Data is persisted for: ';
			var durationArray = space.getPersistenceDuration().split(DUR_REGEXP);
			if (durationArray[2] && durationArray[2] > 0) durationInfo += ' ' + durationArray[2] + ' year(s),';
			if (durationArray[3] && durationArray[3] > 0) durationInfo += ' ' + durationArray[3] + ' month(s),';
			if (durationArray[4] && durationArray[4] > 0) durationInfo += ' ' + durationArray[4] + ' day(s),';
			if (durationArray[6] && durationArray[6] > 0) durationInfo += ' ' + durationArray[6] + ' hour(s),';
			if (durationArray[7] && durationArray[7] > 0) durationInfo += ' ' + durationArray[7] + ' minute(s),';
			if (durationArray[8] && durationArray[8] > 0) durationInfo += ' ' + durationArray[8] + ' second(s),';
			durationInfo = durationInfo.substring(0, durationInfo.length - 1);
			$('#selectedSpacePersistence').text(durationInfo);
			break;
		}
		
		var moderatorList = [];
		var memberList = [];
		$.each(selectedSpace.getMembers(), function(index, member) {
			switch(member.getRole()) {
			case SpacesSDK.Role.MODERATOR:
				moderatorList.push(member.getJID());
				break;
			case SpacesSDK.Role.MEMBER:
				memberList.push(member.getJID());
				break;
			}
		});
		memberList.sort();
		moderatorList.sort();
		$('#spaceMembersTable tbody').empty();
		$.each(moderatorList, function (index, jid) {
			var entry = $('<tr />');
			entry.append($('<td />').text(jid));
			entry.append($('<td />').text('Moderator'));
			if (jid != currentUserInfo.getBareJID()) {
				var degradeBtn = $('<button />').addClass('excludesRoleMember').text('Degrade');
				degradeBtn.bind('click', {jid: jid}, function(event) {
					setMemberRole(event.data.jid, SpacesSDK.Role.MEMBER);
				});
				entry.append(degradeBtn);
				var removeBtn = $('<button />').addClass('excludesRoleMember').text('Remove');
				removeBtn.bind('click', {spaceId: space.getId(), jid: jid}, function(event) {
					removeMember(event.data.jid);
				});
				entry.append(removeBtn);
			}
			
			$('#spaceMembersTable tbody').append(entry);
		});
		$.each(memberList, function (index, jid) {
			var entry = $('<tr />');
			entry.append($('<td />').text(jid));
			entry.append($('<td />').text('Member'));
			var upgradeBtn = $('<button />').addClass('excludesRoleMember').text('Upgrade');
			upgradeBtn.bind('click', {jid: jid}, function(event) {
				setMemberRole(event.data.jid, SpacesSDK.Role.MODERATOR);
			});
			entry.append(upgradeBtn);
			var removeBtn = $('<button />').addClass('excludesRoleMember').text('Remove');
			removeBtn.bind('click', {spaceId: space.getId(), jid: jid}, function(event) {
				removeMember(event.data.jid);
			});
			entry.append(removeBtn);
			$('#spaceMembersTable tbody').append(entry);
		});
		$('#membersList').html(memberList.sort().join(", "));
		
		$('#newUserDomain').val(currentUserInfo.getDomain()).attr('disabled','disabled');
		
		if (space.getType() == SpacesSDK.Type.ORGA) {
			var supportedDataModels = space.getSupportedDataModels();
			$('#spaceDataModelsTable tbody').empty();
			$.each(supportedDataModels.sort(function(a, b) {
				var aName = a.getNamespace().toLowerCase();
				var bName = b.getNamespace().toLowerCase();
				return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
			}), function(index, model) {
				var entry = $('<tr />');
				entry.append($('<td />').text(model.getNamespace()));
				var link = $('<a />').attr('href', model.getSchemaLocation()).attr('target','_blank').addClass('dataModelUrl').text(model.getSchemaLocation()); 
				entry.append($('<td />').append(link));
				var removeButton = $('<button />').addClass('excludesRoleMember').text('Remove');
				removeButton.bind('click', {model: model}, function(event) {
					removeDataModelSupport(event.data.model);
				});
				entry.append($('<td />').append(removeButton));
				$('#spaceDataModelsTable tbody').append(entry);
			});
			if (supportedDataModels.length == 0) {
				$('#noDataModelsSupportedInfo').show();
			} else {
				$('#noDataModelsSupportedInfo').hide();
			}
		}
		// spaceDataModelsTable
		dataHandler.registerSpace(selectedSpace.getId());
		if (space.getPersistenceType() != SpacesSDK.PersistenceType.OFF) {
			dataHandler.queryDataObjectsBySpace(selectedSpace.getId(), [], function(retrievedDataObjects) {
				dataObjects = retrievedDataObjects;
				renderDataObjects();
			}, function(error) {
				console.error('ERROR: Failed to retrieve data objects for space!', error);
				showError('ERROR: Failed to retrieve data objects for space!');
			});
		} else {
			dataObjects = [];
			renderDataObjects();
		}
		
		setView('SPACE_SELECTED');
		setTab('spaceInformationTab', 'General');
	}
	
	function removeMember(jid) {
		if (!selectedSpace) {
			return;
		}
		var newConfig = selectedSpace.generateSpaceConfiguration();
		newConfig.removeMember(jid);
		indicateActivity(true);
		spaceHandler.configureSpace(selectedSpace.getId(), newConfig, function(space) {
			setSelectedSpace(space);
			setTab('spaceInformationTab', 'Members');
			indicateActivity(false);
		}, function(error) {
			indicateActivity(false);
			console.log('Failed to configure space.', error);
			showError('Failed to update space configuration.');
		});
	}
	
	function addMemberToSpace(jid, role) {
		if (!selectedSpace) {
			return;
		}
		var newConfig = selectedSpace.generateSpaceConfiguration();
		var newMember = new SpacesSDK.SpaceMember(jid, role);
		newConfig.addMember(newMember);
		indicateActivity(true);
		spaceHandler.configureSpace(selectedSpace.getId(), newConfig, function(space) {
			setSelectedSpace(space);
			setTab('spaceInformationTab', 'Members');
			indicateActivity(false);
		}, function(error) {
			indicateActivity(false);
			console.log('Failed to configure space.', error);
			showError('Failed to update space configuration.');
		});
	}
	
	function setMemberRole(jid, role) {
		if (!selectedSpace) {
			return;
		}
		var newConfig = selectedSpace.generateSpaceConfiguration();
		var newMember = new SpacesSDK.SpaceMember(jid, role);
		newConfig.addMember(newMember);
		indicateActivity(true);
		spaceHandler.configureSpace(selectedSpace.getId(), newConfig, function(space) {
			setSelectedSpace(space);
			setTab('spaceInformationTab', 'Members');
			indicateActivity(false);
		}, function(error) {
			indicateActivity(false);
			console.log('Failed to configure space.', error);
			showError('Failed to update space configuration.');
		});
	}
	
	function setSpaceName(newName) {
		if (!selectedSpace) {
			return;
		}
		var newConfig = selectedSpace.generateSpaceConfiguration();
		newConfig.setName(newName);
		indicateActivity(true);
		spaceHandler.configureSpace(selectedSpace.getId(), newConfig, function(space) {
			setSelectedSpace(space);
			indicateActivity(false);
		}, function(error) {
			indicateActivity(false);
			console.log('Failed to configure space.', error);
			showError('Failed to update space configuration.');
		});
	}
	
	function setSpacePersistence(type, durationArray) {
		if (!selectedSpace) {
			return;
		}
		var newConfig = selectedSpace.generateSpaceConfiguration();
		newConfig.setPersistenceType(type);
		if (type == SpacesSDK.PersistenceType.DURATION) {
			var durationString = 'P' + durationArray[0] + 'Y' + durationArray[1] + 'M' + durationArray[2] + 'D';
			durationString += 'T' + durationArray[3] + 'H' + durationArray[4] + 'M' + durationArray[5] + 'S';
			newConfig.setPersistenceDuration(durationString);
		} else {
			newConfig.setPersistenceDuration(null);
		}
		indicateActivity(true);
		spaceHandler.configureSpace(selectedSpace.getId(), newConfig, function(space) {
			setSelectedSpace(space);
			if (space.getId() == currentUserInfo.getUsername()) {
				updatePrivateSpaceInfo(space);
			}
			indicateActivity(false);
		}, function(error) {
			indicateActivity(false);
			console.log('Failed to configure space.', error);
			showError('Failed to update space configuration.');
		});
	}
	
	function removeDataModelSupport(modelToRemove) {
		var newModelList = [];
		$.each(selectedSpace.getSupportedDataModels(), function(index, model) {
			if (!model.equals(modelToRemove)) {
				newModelList.push(model);
			}
		});
		indicateActivity(true);
		spaceHandler.setModelsSupportedBySpace(selectedSpace.getId(), newModelList, function(space) {
			setSelectedSpace(space);
			setTab('spaceInformationTab', 'DataModels');
			indicateActivity(false);
		}, function(error) {
			indicateActivity(false);
			console.log('Failed to configure space.', error);
			showError('Failed to update space configuration.');
		});
	}
	
	function addDataModelSupport(namespace, schemaLocation) {
		var modelToAdd = new SpacesSDK.DataModel(namespace, schemaLocation);
		var newModelList = [];
		$.each(selectedSpace.getSupportedDataModels(), function(index, model) {
			if (model.equals(modelToAdd)) {
				showError('The given data model is already supported.');
				return;
			} else {
				newModelList.push(model);
			}
		});
		newModelList.push(modelToAdd);
		indicateActivity(true);
		spaceHandler.setModelsSupportedBySpace(selectedSpace.getId(), newModelList, function(space) {
			setSelectedSpace(space);
			$('#newModelNamespaceInput').val('');
			$('#newModelSchemaLocationInput').val('');			
			setTab('spaceInformationTab', 'DataModels');
			indicateActivity(false);
		}, function(error) {
			indicateActivity(false);
			console.log('Failed to configure space.', error);
			showError('Failed to update space configuration.');
		});
	}
	
	function renderDataObjects() {
		if (!dataObjects) {
			return;
		}
		
		var sortedDataObjects = dataObjects.sort(function(a, b) {
			var aTimeStamp = a.getElement().getAttribute('timestamp');
			var bTimeStamp = b.getElement().getAttribute('timestamp');
			if (aTimeStamp && bTimeStamp) {
				var aDate = new Date(aTimeStamp);
				var bDate = new Date(bTimeStamp);
				return aDate < bDate ? -1 : (aDate > bDate ? 1 : 0);
			} else if (aTimeStamp) {
				return -1;
			} else if (bTimeStamp) {
				return 1;
			} else {
				return 0;
			}
		});
		
		$('#dataObjectsList').empty();
		if (dataObjects.length == 0) {
			$('#dataObjectsList').html('No data objects available.');
		} else {
			$.each(sortedDataObjects, function(index, dataObject) {
				renderNewDataObject(dataObject);
			});
		}
	}
	
	function renderNewDataObject(dataObject) {
		if (dataObjects.length == 0) {
			$('#dataObjectsList').empty();
		}
		var data = {};
		data.id = dataObject.getId();
		data.elementName = dataObject.getElementName();
		data.namespace= dataObject.getNamespaceURI();
		data.xmlString = dataObject.toString();
		data.object = dataObject;
		var timestamp = dataObject.getElement().getAttribute('timestamp');
		if (timestamp) data.timestamp = timestamp;
		var publisher = dataObject.getElement().getAttribute('publisher');
		if (publisher) {
			var userId = publisher.split('@')[0];
			var application = publisher.split('/')[1];
			data.publisher = userId + ' (' + application + ')';
		}
		$('#dataObjectsList').prepend(templates.dataObject(data));
		$('#dataObject_' + data.id).bind('click', {data : data}, function(event) {
			var data = event.data.data;
			var template = dataModelTemplates[data.namespace]; 
			if (template) {
				template.apply(data.object, function(content) {
					$('#dataObjectContent').html(content);
					$('#dataObjectXMLView').text(event.data.data.xmlString);
					$('#dataObjectInfoPopup').bPopup(bPopupOptions);
				}, function(error) {
					console.warn('Failed to render data object ' + data.namespace + ': ' + error);
					$('#dataObjectContent').empty();
					$('#dataObjectXMLView').text(event.data.data.xmlString);
					$('#dataObjectInfoPopup').bPopup(bPopupOptions);
				});
			} else {
				$('#dataObjectContent').empty();
				$('#dataObjectXMLView').text(event.data.data.xmlString);
				$('#dataObjectInfoPopup').bPopup(bPopupOptions);
			}
		});
	}
	
	function publishPingOnSpace() {
		if (!selectedSpace) {
			return;
		}
		var dataObjectBuilder = new SpacesSDK.DataObjectBuilder('ping', 'mirror:application:ping:ping');
		var cdmBuilder = new SpacesSDK.CDMDataBuilder(SpacesSDK.cdm.CDMVersion.CDM_1_0);
		cdmBuilder.setModelVersion("1.0");
		cdmBuilder.setPublisher(currentUserInfo.getFullJID());
		dataObjectBuilder.setCDMData(cdmBuilder.build());
		var dataObject = dataObjectBuilder.build();
		dataHandler.publishDataObject(dataObject, selectedSpace.getId(), function() {
			console.log('Sent ping to space ' + selectedSpace.getId() + '.');
		}, function(error) {
			console.log('Failed to send ping:', error);
			if (error.getElementsByTagName && error.getElementsByTagName('not-allowed').length > 0) {
				alert('Pings are not supported by this space!');
			}
		});
	}
	
	function changePassword(newPassword) {
		var xmppConn = connectionHandler.getXMPPConnection();
		var iqBuilder = $iq({type: 'set', to: currentUserInfo.getDomain()});
		iqBuilder.c('query', {xmlns: Strophe.NS.REGISTER})
			.c('username').t(currentUserInfo.getUsername())
			.up().c('password').t(newPassword);
		xmppConn.sendIQ(iqBuilder.tree(), function(result) {
			if (result.getAttribute && result.getAttribute('type') && result.getAttribute('type') == 'result') {
				showSuccess('The password was updated successfully!');
			} else {
				console.warn('Failed to update the password:', result);
				showError('Failed to update the password.');
			}
		}, function(error) {
			console.warn('Failed to update the password:', error);
			showError('Failed to update the password.');
		}, 2000);
	}
	
	function deleteSpace() {
		if (!selectedSpace) {
			return;
		}

		indicateActivity(true);
		spaceHandler.deleteSpace(selectedSpace.getId(), function() {
			indicateActivity(false);
			var spaceId = selectedSpace.getId();
			showSuccess('Successfully deleted space ' + spaceId + '.');
			$('#spaceSelectionDropdown option[value="' + spaceId + '"]').remove();
			if (spaceId == currentUserInfo.getUsername()) {
				updatePrivateSpaceInfo();
			}
			setView('MAIN');
			unselectSpace();
		}, function(error) {
			indicateActivity(false);
			console.log('Failed to delete space:', error);
			showError('Failed to delete space!');
		});		
	}
	
	module.getSelectedSpace = function() {
		return selectedSpace;
	};
	
	module.getSpaceHandler = function() {
		return spaceHandler;
	};
	
	module.getCurrentUserInfo = function() {
		return currentUserInfo;
	};
	
	module.getDataHandler = function() {
		return dataHandler;
	};
	return module;
}(jQuery));