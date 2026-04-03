!macro customInstall
  ; Register dentistrygpt-passerelle:// protocol handler
  DetailPrint "Registering dentistrygpt-passerelle:// protocol handler..."
  WriteRegStr HKCU "Software\Classes\dentistrygpt-passerelle" "" "URL:DentistryGPT Passerelle Protocol"
  WriteRegStr HKCU "Software\Classes\dentistrygpt-passerelle" "URL Protocol" ""
  WriteRegStr HKCU "Software\Classes\dentistrygpt-passerelle\shell\open\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'
!macroend

!macro customUnInstall
  ; Remove dentistrygpt-passerelle:// protocol handler
  DeleteRegKey HKCU "Software\Classes\dentistrygpt-passerelle"
!macroend
