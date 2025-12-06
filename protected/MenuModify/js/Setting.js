document.addEventListener('DOMContentLoaded', function() {
    // Check if restaurant already exists
    r_exist();

    // Save settings
    document.getElementById('save-settings').addEventListener('click', saveSettings);

    // Cancel changes
    document.getElementById('cancel-changes').addEventListener('click', function() {
        if (confirm('Discard all changes?')) {
            resetForm();
        }
    });

    // Add menu item button
    document.getElementById('add-menu-item').addEventListener('click', addNewMenuItem);
});
async function r_exist(){
    r_id = localStorage.getItem()

}