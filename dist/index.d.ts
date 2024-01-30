export declare function register(): void;
/**
 * Method use to load configuration
 */
export declare function load_resque_json(): void;
/**
 * This is the main method of our plugin.
 *
 */
export declare function do_resque(next: any, connection: any): Promise<any>;
/**
 * Inbound email handling. Set main.rcpt_blackhole=true since
 * we only want to handle outbound email to queue.
 *
 * And let's pretend we can deliver mail to these recipients inbox.
 *
 * Solves: '450 I cannot deliver mail for {user@domain}'
 */
export declare function hook_rcpt(next: any, connection: any): any;
/**
 * Outbound email handling. Since the purpose of this plugin is
 * to simply queue the message, we discard all outbound by default.
 *
 * And let's pretend we sent out mail to outside servers.
 *
 * Solves: Prevent accidentally send out email and thereby getting our
 * server in trouble.
 */
export declare function discard(next: any, connection: any): any;
/**
 * Below is implementing AUTH (auth_method) which is simply
 * copying auth-flat_file: PLAIN,LOGIN,CRAM-MD5
 *
 */
export declare function hook_capabilities(next: any, connection: any): any;
/**
 * Implement to get plain password from configuration and is
 * required by Haraka.
 *
 * Password length must also be greater than 8 characters.
 */
export declare function get_plain_passwd(user: any, connection: any, cb: any): any;
