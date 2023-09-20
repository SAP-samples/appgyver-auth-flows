service demoService @(requires : 'authenticated-user') {
    @readonly
    entity User { 
        userId : String;
        isAdmin : String;
        jwtToken : String;
    }
}

